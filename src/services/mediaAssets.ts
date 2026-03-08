import { supabase } from '@/integrations/supabase/client';
import type { MediaAsset } from '@/types/database';

const BUCKET = 'media';

/** Build the public URL for a file in the media bucket */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export const mediaAssetsService = {
  /** List all media for the current user */
  async list(userId: string): Promise<MediaAsset[]> {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /** List media scoped to a specific project */
  async listByProject(projectId: string): Promise<MediaAsset[]> {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /** Upload a file to storage and create the metadata row. Returns the new row. */
  async upload(
    userId: string,
    file: File,
    opts?: { projectId?: string; dimensions?: { width: number; height: number } },
  ): Promise<MediaAsset> {
    // Build a unique storage path: <userId>/<timestamp>-<filename>
    const ts = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${ts}-${safeName}`;

    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
    if (uploadError) throw uploadError;

    // 2. Create metadata row
    const { data, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        user_id: userId,
        name: file.name,
        storage_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        dimensions: opts?.dimensions ?? null,
        project_id: opts?.projectId ?? null,
      })
      .select()
      .single();
    if (dbError) {
      // Best-effort: clean up the uploaded file
      await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
      throw dbError;
    }
    return data as MediaAsset;
  },

  /** Delete both the storage file and the metadata row */
  async remove(assetId: string, storagePath?: string) {
    // If we have the path, remove from storage first
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]).catch(console.error);
    }
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', assetId);
    if (error) throw error;
  },
};
