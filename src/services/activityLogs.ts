import { supabase } from '@/integrations/supabase/client';

// ── Action catalogue ──
export type ActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_opened'
  | 'canvas_saved'
  | 'media_uploaded';

interface LogPayload {
  user_id: string;
  action: ActivityAction;
  project_id?: string | null;
  metadata?: Record<string, unknown>;
}

export const activityLogsService = {
  /** Generic insert – all helpers delegate here */
  async log(entry: LogPayload) {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      project_id: entry.project_id ?? null,
      metadata: entry.metadata ?? null,
    });
    if (error) console.warn('[activity_log]', error.message);
    // Fire-and-forget – never throw; logging must not block UX
  },

  /** Fetch recent activity for the current user */
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

  // ── Convenience helpers ──

  projectCreated(userId: string, projectId: string, name: string) {
    return this.log({ user_id: userId, action: 'project_created', project_id: projectId, metadata: { name } });
  },

  projectUpdated(userId: string, projectId: string, fields: string[]) {
    return this.log({ user_id: userId, action: 'project_updated', project_id: projectId, metadata: { fields } });
  },

  projectDeleted(userId: string, projectId: string) {
    return this.log({ user_id: userId, action: 'project_deleted', project_id: projectId });
  },

  projectOpened(userId: string, projectId: string) {
    return this.log({ user_id: userId, action: 'project_opened', project_id: projectId });
  },

  canvasSaved(userId: string, projectId: string, version: number) {
    return this.log({ user_id: userId, action: 'canvas_saved', project_id: projectId, metadata: { version } });
  },

  mediaUploaded(userId: string, projectId: string | null, fileName: string) {
    return this.log({ user_id: userId, action: 'media_uploaded', project_id: projectId, metadata: { fileName } });
  },
};
