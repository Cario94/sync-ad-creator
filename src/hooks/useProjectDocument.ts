import { useState, useEffect, useCallback, useRef } from 'react';
import { projectDocumentsService } from '@/services/projectDocuments';
import { projectsService } from '@/services/projects';
import { useAuth } from '@/contexts/AuthContext';
import type { CanvasState } from '@/types/database';
import { BLANK_CANVAS_STATE } from '@/types/database';
import type { CanvasElement } from '@/components/workspace/types/canvas';

/** Stored edge – extends the base schema edge with UI-only fields */
export interface StoredEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType?: 'campaign' | 'adset' | 'ad';
  targetType?: 'campaign' | 'adset' | 'ad';
}

export interface ProjectDocumentState {
  elements: CanvasElement[];
  connections: StoredEdge[];
  viewport: { x: number; y: number; zoom: number };
}

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

interface UseProjectDocumentReturn {
  projectId: string | null;
  documentState: ProjectDocumentState | null;
  version: number;
  isLoading: boolean;
  error: string | null;
  save: (state: ProjectDocumentState) => Promise<void>;
  saveStatus: SaveStatus;
  /** Call when the user makes any change to mark the document dirty */
  markDirty: () => void;
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

  // Load project + document
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
          const cs = doc.canvas_state;
          // Ensure every node has a config object for roundtrip safety
          const nodes = ((cs.nodes ?? []) as unknown as CanvasElement[]).map(n => ({
            ...n,
            config: n.config ?? {},
          }));
          setDocumentState({
            elements: nodes,
            connections: (cs.edges ?? []) as unknown as StoredEdge[],
            viewport: cs.viewport ?? BLANK_CANVAS_STATE.viewport,
          });
          setVersion(doc.version);
          versionRef.current = doc.version;
        } else {
          setDocumentState({
            elements: [],
            connections: [],
            viewport: { ...BLANK_CANVAS_STATE.viewport },
          });
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
  }, [user, paramProjectId]);

  const markDirty = useCallback(() => {
    setSaveStatus(prev => {
      // Don't override 'saving' status
      if (prev === 'saving') return prev;
      return 'unsaved';
    });
  }, []);

  const save = useCallback(async (state: ProjectDocumentState) => {
    if (!projectId) return;
    try {
      // Clear any pending "saved" timer
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      setSaveStatus('saving');
      const canvasState: CanvasState = {
        viewport: state.viewport,
        nodes: state.elements as unknown as CanvasState['nodes'],
        edges: state.connections as unknown as CanvasState['edges'],
      };
      const newVersion = await projectDocumentsService.save(projectId, canvasState, versionRef.current);
      versionRef.current = newVersion;
      setVersion(newVersion);
      setSaveStatus('saved');

      // Revert to idle after 3 seconds
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('[useProjectDocument] save error', err);
      setSaveStatus('error');
      throw err;
    }
  }, [projectId]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { projectId, documentState, version, isLoading, error, save, saveStatus, markDirty };
}
