import { supabase } from '@/integrations/supabase/client';
import type { CanvasState } from '@/types/database';

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

  async save(projectId: string, canvasState: CanvasState, currentVersion: number) {
    const { data, error } = await supabase
      .from('project_documents')
      .update({ canvas_state: canvasState as unknown as Record<string, unknown>, version: currentVersion + 1 })
      .eq('project_id', projectId)
      .select('version')
      .single();
    if (error) throw error;
    return data?.version ?? currentVersion + 1;
  },
};
