import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_PREFERENCES, type UserPreferences } from '@/types/database';

export const userSettingsService = {
  /** Get user preferences, merged with defaults for any missing keys */
  async get(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('preferences')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    const stored = (data?.preferences as unknown as UserPreferences) ?? {};
    return { ...DEFAULT_PREFERENCES, ...stored };
  },

  /** Partial update — merges provided keys into existing preferences */
  async update(userId: string, partial: Partial<UserPreferences>) {
    const current = await this.get(userId);
    const merged = { ...current, ...partial };
    const { error } = await supabase
      .from('user_settings')
      .update({ preferences: JSON.parse(JSON.stringify(merged)) })
      .eq('user_id', userId);
    if (error) throw error;
    return merged;
  },
};
