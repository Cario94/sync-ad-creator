import { supabase } from '@/integrations/supabase/client';
import type { CanvasState } from '@/types/database';

export class VersionConflictError extends Error {
  constructor() {
    super('Document was modified elsewhere. Please refresh and try again.');
    this.name = 'VersionConflictError';
  }
}

export const projectDocumentsService = {
  async get(projectId: string): Promise<{ canvas_state: CanvasState; version: number } | null> {
    const { data, error } = await supabase
      .from('project_documents')
      .select('canvas_state, version')
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data ? { canvas_state: data.canvas_state as unknown as CanvasState, version: data.version } : null;
  },

  /**
   * Save with optimistic concurrency control.
   * The update only succeeds if the current DB version matches `expectedVersion`.
   * This prevents silent overwrites from stale tabs or race conditions.
   */
  async save(projectId: string, canvasState: CanvasState, expectedVersion: number) {
    const payload = JSON.parse(JSON.stringify(canvasState));
    const newVersion = expectedVersion + 1;

    const { data, error } = await supabase
      .from('project_documents')
      .update({ canvas_state: payload, version: newVersion })
      .eq('project_id', projectId)
      .eq('version', expectedVersion) // optimistic concurrency check
      .select('version')
      .single();

    // If no row matched, the version was stale
    if (error && error.code === 'PGRST116') {
      throw new VersionConflictError();
    }
    if (error) throw error;

    return data?.version ?? newVersion;
  },
};
