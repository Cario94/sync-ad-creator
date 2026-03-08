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

interface UseProjectDocumentReturn {
  /** Current project ID (may be auto-created) */
  projectId: string | null;
  /** Loaded document state – null while loading */
  documentState: ProjectDocumentState | null;
  /** DB version for optimistic concurrency */
  version: number;
  /** True during initial load */
  isLoading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Persist current canvas state to DB */
  save: (state: ProjectDocumentState) => Promise<void>;
  /** Whether a save is in progress */
  isSaving: boolean;
}

export function useProjectDocument(paramProjectId?: string): UseProjectDocumentReturn {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(paramProjectId ?? null);
  const [documentState, setDocumentState] = useState<ProjectDocumentState | null>(null);
  const [version, setVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const versionRef = useRef(1);

  // Ensure a project exists, then load its document
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let pid = paramProjectId ?? null;

        // If no project ID provided, get the most recent project or create one
        if (!pid) {
          const projects = await projectsService.list(user.id);
          if (projects.length > 0) {
            pid = projects[0].id;
          } else {
            const newProject = await projectsService.create({
              user_id: user.id,
              name: 'My First Project',
            });
            pid = newProject.id;
          }
        }

        if (cancelled) return;
        setProjectId(pid);

        // Load the project document (trigger creates it on project insert)
        const doc = await projectDocumentsService.get(pid);

        if (cancelled) return;

        if (doc) {
          const cs = doc.canvas_state;
          setDocumentState({
            elements: (cs.nodes ?? []) as unknown as CanvasElement[],
            connections: (cs.edges ?? []) as unknown as StoredEdge[],
            viewport: cs.viewport ?? BLANK_CANVAS_STATE.viewport,
          });
          setVersion(doc.version);
          versionRef.current = doc.version;
        } else {
          // Fallback – should not happen if trigger works
          setDocumentState({
            elements: [],
            connections: [],
            viewport: { ...BLANK_CANVAS_STATE.viewport },
          });
        }
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

  const save = useCallback(async (state: ProjectDocumentState) => {
    if (!projectId) return;
    try {
      setIsSaving(true);
      const canvasState: CanvasState = {
        viewport: state.viewport,
        nodes: state.elements as unknown as CanvasState['nodes'],
        edges: state.connections as unknown as CanvasState['edges'],
      };
      const newVersion = await projectDocumentsService.save(projectId, canvasState, versionRef.current);
      versionRef.current = newVersion;
      setVersion(newVersion);
    } catch (err) {
      console.error('[useProjectDocument] save error', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  return { projectId, documentState, version, isLoading, error, save, isSaving };
}
