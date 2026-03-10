import { useState, useEffect, useCallback, useRef } from 'react';
import { projectDocumentsService, VersionConflictError } from '@/services/projectDocuments';
import { useAuth } from '@/contexts/AuthContext';
import type { CanvasState } from '@/types/database';
import { BLANK_CANVAS_STATE } from '@/types/database';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { WorkspaceConnection } from '@/types/workspaceGraph';
import {
  canvasStateToWorkspaceDocument,
  workspaceDocumentToCanvasState,
  type WorkspaceViewport,
} from '@/lib/workspaceGraphMapper';
import { toast } from 'sonner';

export interface ProjectDocumentState {
  elements: CanvasElement[];
  connections: WorkspaceConnection[];
  viewport: WorkspaceViewport;
}

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error' | 'conflict';

interface UseProjectDocumentReturn {
  projectId: string | null;
  documentState: ProjectDocumentState | null;
  version: number;
  isLoading: boolean;
  error: string | null;
  save: (state: ProjectDocumentState) => Promise<void>;
  saveStatus: SaveStatus;
  markDirty: () => void;
  reload: () => void;
}

export function useProjectDocument(paramProjectId?: string): UseProjectDocumentReturn {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(paramProjectId ?? null);
  const [documentState, setDocumentState] = useState<ProjectDocumentState | null>(null);
  const [version, setVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const versionRef = useRef(1);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pid = paramProjectId ?? null;

        if (!pid) {
          if (!cancelled) setError('No project selected');
          return;
        }

        if (cancelled) return;
        setProjectId(pid);

        const doc = await projectDocumentsService.get(pid);

        if (cancelled) return;

        if (doc) {
          const normalized = canvasStateToWorkspaceDocument(doc.canvas_state as CanvasState);
          setDocumentState(normalized);
          setVersion(doc.version);
          versionRef.current = doc.version;
        } else {
          const blank = canvasStateToWorkspaceDocument(BLANK_CANVAS_STATE);
          setDocumentState(blank);
          setVersion(1);
          versionRef.current = 1;
        }
        setSaveStatus('idle');
      } catch (err) {
        console.error('[useProjectDocument] load error', err);
        if (!cancelled) setError('Failed to load project');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [user, paramProjectId, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey(k => k + 1);
  }, []);

  const markDirty = useCallback(() => {
    setSaveStatus(prev => {
      if (prev === 'saving') return prev;
      return 'unsaved';
    });
  }, []);

  const save = useCallback(async (state: ProjectDocumentState) => {
    if (!projectId) return;
    try {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      setSaveStatus('saving');
      const canvasState = workspaceDocumentToCanvasState(state);
      const newVersion = await projectDocumentsService.save(projectId, canvasState, versionRef.current);
      versionRef.current = newVersion;
      setVersion(newVersion);
      setSaveStatus('saved');

      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('[useProjectDocument] save error', err);

      if (err instanceof VersionConflictError) {
        setSaveStatus('conflict');
        toast.error('Save conflict', {
          description: 'This project was modified elsewhere. Reload to get the latest version.',
          action: { label: 'Reload', onClick: () => reload() },
          duration: 10000,
        });
      } else {
        setSaveStatus('error');
      }
      throw err;
    }
  }, [projectId, reload]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { projectId, documentState, version, isLoading, error, save, saveStatus, markDirty, reload };
}
