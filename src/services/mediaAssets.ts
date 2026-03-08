import { supabase } from '@/integrations/supabase/client';
import type { MediaAsset } from '@/types/database';

export const mediaAssetsService = {
  async list(userId: string): Promise<MediaAsset[]> {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(asset: { user_id: string; name: string; storage_path: string; file_type: string; file_size?: number; dimensions?: { width: number; height: number } }) {
    const { data, error } = await supabase
      .from('media_assets')
      .insert(asset)
      .select()
      .single();
    if (error) throw error;
    return data as MediaAsset;
  },

  async remove(assetId: string) {
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', assetId);
    if (error) throw error;
  },
};
