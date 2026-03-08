import { supabase } from '@/integrations/supabase/client';
import type { UserPreferences } from '@/types/database';

export const userSettingsService = {
  async get(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('preferences')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return (data?.preferences as unknown as UserPreferences) ?? {};
  },

  async update(userId: string, preferences: UserPreferences) {
    const { error } = await supabase
      .from('user_settings')
      .update({ preferences: preferences as unknown as Record<string, unknown> })
      .eq('user_id', userId);
    if (error) throw error;
  },
};
