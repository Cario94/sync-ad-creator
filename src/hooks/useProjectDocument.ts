import { useState, useEffect, useCallback, useRef } from 'react';
import { projectDocumentsService, VersionConflictError } from '@/services/projectDocuments';
import { useAuth } from '@/contexts/AuthContext';
import type { CanvasState } from '@/types/database';
import { BLANK_CANVAS_STATE } from '@/types/database';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { WorkspaceConnection, WorkspaceNodeType } from '@/types/workspaceGraph';
import { toast } from 'sonner';

/** Persisted node shape compatible with React Flow */
interface PersistedFlowNode {
  id: string;
  type: WorkspaceNodeType;
  position: { x: number; y: number };
  data?: {
    label?: string;
    config?: Record<string, unknown>;
  };
  // legacy fields still accepted while reading
  name?: string;
  config?: Record<string, unknown>;
}

/** Persisted edge shape compatible with React Flow */
interface PersistedFlowEdge {
  id: string;
  source?: string;
  target?: string;
  data?: {
    sourceType?: WorkspaceNodeType;
    targetType?: WorkspaceNodeType;
  };
  // legacy fields still accepted while reading
  sourceId?: string;
  targetId?: string;
  sourceType?: WorkspaceNodeType;
  targetType?: WorkspaceNodeType;
}

export interface ProjectDocumentState {
  elements: CanvasElement[];
  connections: WorkspaceConnection[];
  viewport: { x: number; y: number; zoom: number };
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
  /** Call when the user makes any change to mark the document dirty */
  markDirty: () => void;
  /** Re-fetch the document from the database (e.g. after a version conflict) */
  reload: () => void;
}

const toElement = (node: PersistedFlowNode): CanvasElement => ({
  id: node.id,
  type: node.type,
  name: node.data?.label ?? node.name ?? 'Untitled',
  position: node.position,
  config: node.data?.config ?? node.config ?? {},
});

const toConnection = (edge: PersistedFlowEdge, elementTypeById: Map<string, WorkspaceNodeType>): WorkspaceConnection | null => {
  const sourceId = edge.source ?? edge.sourceId;
  const targetId = edge.target ?? edge.targetId;

  if (!sourceId || !targetId) return null;

  return {
    id: edge.id,
    sourceId,
    targetId,
    sourceType: edge.data?.sourceType ?? edge.sourceType ?? elementTypeById.get(sourceId) ?? 'campaign',
    targetType: edge.data?.targetType ?? edge.targetType ?? elementTypeById.get(targetId) ?? 'adset',
  };
};

const toPersistedNode = (element: CanvasElement): PersistedFlowNode => ({
  id: element.id,
  type: element.type,
  position: element.position,
  data: {
    label: element.name,
    config: element.config ?? {},
  },
});

const toPersistedEdge = (connection: WorkspaceConnection): PersistedFlowEdge => ({
  id: connection.id,
  source: connection.sourceId,
  target: connection.targetId,
  data: {
    sourceType: connection.sourceType,
    targetType: connection.targetType,
  },
});

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
          const nodes = (cs.nodes ?? []) as unknown as PersistedFlowNode[];
          const elements = nodes.map(toElement);
          const typeMap = new Map(elements.map(el => [el.id, el.type]));
          const connections = ((cs.edges ?? []) as unknown as PersistedFlowEdge[])
            .map(edge => toConnection(edge, typeMap))
            .filter((edge): edge is WorkspaceConnection => edge !== null);

          setDocumentState({
            elements,
            connections,
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
      const canvasState: CanvasState = {
        viewport: state.viewport,
        nodes: state.elements.map(toPersistedNode) as unknown as CanvasState['nodes'],
        edges: state.connections.map(toPersistedEdge) as unknown as CanvasState['edges'],
      };
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

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { projectId, documentState, version, isLoading, error, save, saveStatus, markDirty, reload };
}
