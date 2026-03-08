import { supabase } from '@/integrations/supabase/client';
import type { MediaAsset } from '@/types/database';

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

  /** Create a media asset metadata record (storage upload handled separately) */
  async create(asset: {
    user_id: string;
    name: string;
    storage_path: string;
    file_type: string;
    file_size?: number;
    dimensions?: { width: number; height: number };
    project_id?: string;
  }) {
    const { data, error } = await supabase
      .from('media_assets')
      .insert(asset)
      .select()
      .single();
    if (error) throw error;
    return data as MediaAsset;
  },

  /** Delete a media asset record (storage file deletion handled separately) */
  async remove(assetId: string) {
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', assetId);
    if (error) throw error;
  },
};
