import { supabase } from '@/integrations/supabase/client';
import type { ActivityLogInsert } from '@/types/database';

export const activityLogsService = {
  async log(entry: Pick<ActivityLogInsert, 'user_id' | 'action' | 'project_id' | 'metadata'>) {
    const { error } = await supabase
      .from('activity_logs')
      .insert(entry);
    if (error) throw error;
  },

  async list(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
