import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectDocument, type ProjectDocumentState, type SaveStatus } from '@/hooks/useProjectDocument';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { Edge, Node } from '@xyflow/react';
import { defaultCampaignConfig, defaultAdSetConfig, defaultAdConfig } from '@/components/workspace/types/canvas';
import type { WorkspaceConnection as Connection } from '@/types/workspaceGraph';
import {
  reactFlowEdgesToWorkspaceConnections,
  reactFlowNodesToWorkspaceElements,
  workspaceConnectionsToReactFlowEdges,
  workspaceElementsToFlowNodes,
  type WorkspaceFlowNodeData,
} from '@/lib/workspaceGraphMapper';
import { projectsService } from '@/services/projects';
import { activityLogsService } from '@/services/activityLogs';
import { toast } from 'sonner';

// ── History ──

const MAX_HISTORY = 50;

interface Snapshot {
  nodes: Node<WorkspaceFlowNodeData>[];
  edges: Edge[];
}

// ── Types ──

export interface WorkspaceState {
  projectId: string | null;
  projectName: string;
  isLoading: boolean;
  error: string | null;
  saveStatus: SaveStatus;
  save: () => Promise<void>;

  nodes: Node<WorkspaceFlowNodeData>[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node<WorkspaceFlowNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;

  elements: CanvasElement[];
  connections: Connection[];

  markDirty: () => void;

  selectedElementIds: string[];
  setSelectedElementIds: React.Dispatch<React.SetStateAction<string[]>>;

  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElements: (ids: string[]) => void;

  addCampaign: () => void;
  addAdSet: () => void;
  addAd: () => void;

  viewportRef: React.MutableRefObject<{ x: number; y: number; zoom: number }>;

  // History
  undo: () => void;
  redo: () => void;
  /** Capture current state before a mutation so it can be undone */
  pushSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}

// ── Helpers ──

const generateId = (type: string) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Provider ──

interface WorkspaceProviderProps {
  paramProjectId?: string;
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ paramProjectId, children }) => {
  const { user } = useAuth();

  const {
    projectId, documentState, version, isLoading, error,
    save: rawSave, saveStatus, markDirty,
  } = useProjectDocument(paramProjectId);

  // ── Source-of-truth state (React Flow-native during editing) ──
  const [nodes, setNodes] = useState<Node<WorkspaceFlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Fetch project metadata + update last_opened_at + log open
  useEffect(() => {
    if (!projectId || !user) return;
    projectsService.get(projectId).then(project => {
      if (project) setProjectName(project.name);
    }).catch(() => {});
    projectsService.update(projectId, { last_opened_at: new Date().toISOString() }).catch(() => {});
    activityLogsService.projectOpened(user.id, projectId);
  }, [projectId, user]);

  // ── History (managed via refs to avoid re-renders on every push) ──
  const historyRef = useRef<Snapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyTrigger, setHistoryTrigger] = useState(0); // for canUndo/canRedo reactivity

  const hydratedRef = useRef(false);

  // Hydrate once when documentState arrives
  useEffect(() => {
    if (!documentState) return;
    hydratedRef.current = false;
    const hydratedNodes = workspaceElementsToFlowNodes(documentState.elements);
    const hydratedEdges = workspaceConnectionsToReactFlowEdges(documentState.connections);

    setNodes(hydratedNodes);
    setEdges(hydratedEdges);
    viewportRef.current = documentState.viewport;

    // Seed history with initial state
    const initial: Snapshot = {
      nodes: hydratedNodes,
      edges: hydratedEdges,
    };
    historyRef.current = [initial];
    historyIndexRef.current = 0;
    setHistoryTrigger(t => t + 1);

    requestAnimationFrame(() => { hydratedRef.current = true; });
  }, [documentState]);

  const elements = useMemo(() => reactFlowNodesToWorkspaceElements(nodes), [nodes]);
  const connections = useMemo(() => reactFlowEdgesToWorkspaceConnections(edges, nodes), [edges, nodes]);

  // ── Dirty tracking ──
  const smartMarkDirty = useCallback(() => {
    if (hydratedRef.current) markDirty();
  }, [markDirty]);

  // ── Save ──
  const save = useCallback(async () => {
    const state: ProjectDocumentState = {
      elements,
      connections,
      viewport: viewportRef.current,
    };
    await rawSave(state);
    // Log canvas save (fire-and-forget)
    if (user && projectId) {
      activityLogsService.canvasSaved(user.id, projectId, version);
    }
  }, [elements, connections, rawSave, user, projectId, version]);

  // ── History helpers (use refs for latest state) ──
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  /** Capture current state as a snapshot (call BEFORE mutating) */
  const pushSnapshot = useCallback(() => {
    if (!hydratedRef.current) return;
    const snapshot: Snapshot = {
      nodes: nodesRef.current.map(n => ({
        ...n,
        position: { ...n.position },
        data: n.data ? { ...n.data, config: n.data.config ? { ...n.data.config } : {} } : undefined,
      })),
      edges: edgesRef.current.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined })),
    };
    const idx = historyIndexRef.current;
    // Trim any forward history
    const newHistory = [...historyRef.current.slice(0, idx + 1), snapshot];
    // Cap history length
    if (newHistory.length > MAX_HISTORY) newHistory.splice(0, newHistory.length - MAX_HISTORY);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setHistoryTrigger(t => t + 1);
  }, []);

  const applySnapshot = useCallback((snapshot: Snapshot) => {
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    smartMarkDirty();
  }, [smartMarkDirty]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      toast.info('Nothing to undo');
      return;
    }
    // Save current state as forward history if we're at the tip
    if (historyIndexRef.current === historyRef.current.length - 1) {
      const current: Snapshot = {
        nodes: nodesRef.current.map(n => ({
          ...n,
          position: { ...n.position },
          data: n.data ? { ...n.data, config: n.data.config ? { ...n.data.config } : {} } : undefined,
        })),
        edges: edgesRef.current.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined })),
      };
      // Replace the tip with current state (in case it changed since last push)
      historyRef.current[historyIndexRef.current] = current;
    }
    historyIndexRef.current -= 1;
    applySnapshot(historyRef.current[historyIndexRef.current]);
    setHistoryTrigger(t => t + 1);
    toast.info('Undo');
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      toast.info('Nothing to redo');
      return;
    }
    historyIndexRef.current += 1;
    applySnapshot(historyRef.current[historyIndexRef.current]);
    setHistoryTrigger(t => t + 1);
    toast.info('Redo');
  }, [applySnapshot]);

  const canUndo = useMemo(() => historyIndexRef.current > 0, [historyTrigger]);
  const canRedo = useMemo(() => historyIndexRef.current < historyRef.current.length - 1, [historyTrigger]);

  // ── Element CRUD (all push snapshot before mutating) ──

  const addElement = useCallback((element: CanvasElement) => {
    pushSnapshot();
    const el: CanvasElement = { ...element, config: element.config ?? {} };
    const node = workspaceElementsToFlowNodes([el])[0];
    setNodes(prev => [...prev, node]);
    setSelectedElementIds([el.id]);
    smartMarkDirty();
  }, [smartMarkDirty, pushSnapshot]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    pushSnapshot();
    setNodes(prev => prev.map(node => node.id === id
      ? { ...node, data: { ...node.data, label: updates.name ?? node.data.label, config: updates.config ?? node.data.config } }
      : node));
    smartMarkDirty();
  }, [smartMarkDirty, pushSnapshot]);

  const removeElements = useCallback((ids: string[]) => {
    pushSnapshot();
    const idSet = new Set(ids);
    setNodes(prev => prev.filter(node => !idSet.has(node.id)));
    setEdges(prev => prev.filter(edge => !idSet.has(edge.source) && !idSet.has(edge.target)));
    setSelectedElementIds(prev => prev.filter(id => !idSet.has(id)));
    smartMarkDirty();
  }, [smartMarkDirty, pushSnapshot]);

  // ── Convenience factories ──

  const findOpenPosition = useCallback((type: CanvasElement['type'], currentElements: CanvasElement[]): { x: number; y: number } => {
    const col = type === 'campaign' ? 0 : type === 'adset' ? 1 : 2;
    const baseX = 100 + col * 350;
    const baseY = 100;
    const step = 170;
    const sameCol = currentElements.filter(el => el.type === type);
    return { x: baseX, y: baseY + sameCol.length * step };
  }, []);

  const addCampaign = useCallback(() => {
    pushSnapshot();
    setNodes(prev => {
      const existing = reactFlowNodesToWorkspaceElements(prev);
      const element: CanvasElement = {
        id: generateId('campaign'),
        type: 'campaign',
        name: `Campaign ${existing.filter(e => e.type === 'campaign').length + 1}`,
        position: findOpenPosition('campaign', existing),
        config: defaultCampaignConfig() as unknown as Record<string, unknown>,
      };
      smartMarkDirty();
      setSelectedElementIds([element.id]);
      toast.success('Campaign created');
      return [...prev, workspaceElementsToFlowNodes([element])[0]];
    });
  }, [findOpenPosition, smartMarkDirty, pushSnapshot]);

  const addAdSet = useCallback(() => {
    setNodes(prev => {
      const existing = reactFlowNodesToWorkspaceElements(prev);
      const campaigns = existing.filter(e => e.type === 'campaign');
      if (campaigns.length === 0) {
        toast.error('Create a Campaign first', { description: 'Ad Sets must belong to a Campaign.' });
        return prev;
      }
      pushSnapshot();
      const element: CanvasElement = {
        id: generateId('adset'),
        type: 'adset',
        name: `Ad Set ${existing.filter(e => e.type === 'adset').length + 1}`,
        position: findOpenPosition('adset', existing),
        config: defaultAdSetConfig() as unknown as Record<string, unknown>,
      };
      smartMarkDirty();
      setSelectedElementIds([element.id]);
      toast.success('Ad Set created');
      return [...prev, workspaceElementsToFlowNodes([element])[0]];
    });
  }, [findOpenPosition, smartMarkDirty, pushSnapshot]);

  const addAd = useCallback(() => {
    setNodes(prev => {
      const existing = reactFlowNodesToWorkspaceElements(prev);
      const adSets = existing.filter(e => e.type === 'adset');
      if (adSets.length === 0) {
        toast.error('Create an Ad Set first', { description: 'Ads must belong to an Ad Set.' });
        return prev;
      }
      pushSnapshot();
      const element: CanvasElement = {
        id: generateId('ad'),
        type: 'ad',
        name: `Ad ${existing.filter(e => e.type === 'ad').length + 1}`,
        position: findOpenPosition('ad', existing),
        config: defaultAdConfig() as unknown as Record<string, unknown>,
      };
      smartMarkDirty();
      setSelectedElementIds([element.id]);
      toast.success('Ad created');
      return [...prev, workspaceElementsToFlowNodes([element])[0]];
    });
  }, [findOpenPosition, smartMarkDirty, pushSnapshot]);

  const value: WorkspaceState = {
    projectId, projectName, isLoading, error, saveStatus, save,
    nodes, edges, setNodes, setEdges,
    elements, connections,
    markDirty: smartMarkDirty,
    selectedElementIds, setSelectedElementIds,
    addElement, updateElement, removeElements,
    addCampaign, addAdSet, addAd,
    viewportRef,
    undo, redo, pushSnapshot, canUndo, canRedo,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
