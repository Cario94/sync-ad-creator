import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectDocument, type ProjectDocumentState, type SaveStatus, type StoredEdge } from '@/hooks/useProjectDocument';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import { defaultCampaignConfig, defaultAdSetConfig, defaultAdConfig } from '@/components/workspace/types/canvas';
import type { Connection } from '@/hooks/useConnections';
import { projectsService } from '@/services/projects';
import { toast } from 'sonner';

// ── History ──

const MAX_HISTORY = 50;

interface Snapshot {
  elements: CanvasElement[];
  connections: Connection[];
}

// ── Types ──

export interface WorkspaceState {
  projectId: string | null;
  projectName: string;
  isLoading: boolean;
  error: string | null;
  saveStatus: SaveStatus;
  save: () => Promise<void>;

  elements: CanvasElement[];
  connections: Connection[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;

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
    projectId, documentState, isLoading, error,
    save: rawSave, saveStatus, markDirty,
  } = useProjectDocument(paramProjectId);

  // ── Source-of-truth state ──
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Fetch project metadata + update last_opened_at
  useEffect(() => {
    if (!projectId) return;
    projectsService.get(projectId).then(project => {
      if (project) setProjectName(project.name);
    }).catch(() => {});
    // Fire-and-forget: update last_opened_at
    projectsService.update(projectId, { last_opened_at: new Date().toISOString() }).catch(() => {});
  }, [projectId]);

  // ── History (managed via refs to avoid re-renders on every push) ──
  const historyRef = useRef<Snapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyTrigger, setHistoryTrigger] = useState(0); // for canUndo/canRedo reactivity

  const hydratedRef = useRef(false);

  // Hydrate once when documentState arrives
  useEffect(() => {
    if (!documentState) return;
    hydratedRef.current = false;
    setElements(documentState.elements);
    setConnections(documentState.connections as Connection[]);
    viewportRef.current = documentState.viewport;

    // Seed history with initial state
    const initial: Snapshot = {
      elements: documentState.elements,
      connections: documentState.connections as Connection[],
    };
    historyRef.current = [initial];
    historyIndexRef.current = 0;
    setHistoryTrigger(t => t + 1);

    requestAnimationFrame(() => { hydratedRef.current = true; });
  }, [documentState]);

  // ── Dirty tracking ──
  const smartMarkDirty = useCallback(() => {
    if (hydratedRef.current) markDirty();
  }, [markDirty]);

  // ── Save ──
  const save = useCallback(async () => {
    const state: ProjectDocumentState = {
      elements,
      connections: connections as StoredEdge[],
      viewport: viewportRef.current,
    };
    await rawSave(state);
  }, [elements, connections, rawSave]);

  // ── History helpers (use refs for latest state) ──
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  /** Capture current state as a snapshot (call BEFORE mutating) */
  const pushSnapshot = useCallback(() => {
    if (!hydratedRef.current) return;
    const snapshot: Snapshot = {
      elements: elementsRef.current.map(e => ({ ...e, config: e.config ? { ...e.config } : {} })),
      connections: [...connectionsRef.current],
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
    setElements(snapshot.elements);
    setConnections(snapshot.connections);
    smartMarkDirty();
  }, [smartMarkDirty, setElements, setConnections]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      toast.info('Nothing to undo');
      return;
    }
    // Save current state as forward history if we're at the tip
    if (historyIndexRef.current === historyRef.current.length - 1) {
      const current: Snapshot = {
        elements: elementsRef.current.map(e => ({ ...e, config: e.config ? { ...e.config } : {} })),
        connections: [...connectionsRef.current],
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

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // ── Element CRUD (all push snapshot before mutating) ──

  const addElement = useCallback((element: CanvasElement) => {
    pushSnapshot();
    const el: CanvasElement = { ...element, config: element.config ?? {} };
    setElements(prev => [...prev, el]);
    setSelectedElementIds([el.id]);
    smartMarkDirty();
  }, [smartMarkDirty, pushSnapshot]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    pushSnapshot();
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    smartMarkDirty();
  }, [smartMarkDirty, pushSnapshot]);

  const removeElements = useCallback((ids: string[]) => {
    pushSnapshot();
    const idSet = new Set(ids);
    setElements(prev => prev.filter(el => !idSet.has(el.id)));
    setConnections(prev => prev.filter(c => !idSet.has(c.sourceId) && !idSet.has(c.targetId)));
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
    setElements(prev => {
      const element: CanvasElement = {
        id: generateId('campaign'),
        type: 'campaign',
        name: `Campaign ${prev.filter(e => e.type === 'campaign').length + 1}`,
        position: findOpenPosition('campaign', prev),
        config: defaultCampaignConfig() as unknown as Record<string, unknown>,
      };
      smartMarkDirty();
      setSelectedElementIds([element.id]);
      toast.success('Campaign created');
      return [...prev, element];
    });
  }, [findOpenPosition, smartMarkDirty, pushSnapshot]);

  const addAdSet = useCallback(() => {
    setElements(prev => {
      const campaigns = prev.filter(e => e.type === 'campaign');
      if (campaigns.length === 0) {
        toast.error('Create a Campaign first', { description: 'Ad Sets must belong to a Campaign.' });
        return prev;
      }
      pushSnapshot();
      const element: CanvasElement = {
        id: generateId('adset'),
        type: 'adset',
        name: `Ad Set ${prev.filter(e => e.type === 'adset').length + 1}`,
        position: findOpenPosition('adset', prev),
        config: defaultAdSetConfig() as unknown as Record<string, unknown>,
      };
      smartMarkDirty();
      setSelectedElementIds([element.id]);
      toast.success('Ad Set created');
      return [...prev, element];
    });
  }, [findOpenPosition, smartMarkDirty, pushSnapshot]);

  const addAd = useCallback(() => {
    setElements(prev => {
      const adSets = prev.filter(e => e.type === 'adset');
      if (adSets.length === 0) {
        toast.error('Create an Ad Set first', { description: 'Ads must belong to an Ad Set.' });
        return prev;
      }
      pushSnapshot();
      const element: CanvasElement = {
        id: generateId('ad'),
        type: 'ad',
        name: `Ad ${prev.filter(e => e.type === 'ad').length + 1}`,
        position: findOpenPosition('ad', prev),
        config: defaultAdConfig() as unknown as Record<string, unknown>,
      };
      smartMarkDirty();
      setSelectedElementIds([element.id]);
      toast.success('Ad created');
      return [...prev, element];
    });
  }, [findOpenPosition, smartMarkDirty, pushSnapshot]);

  const value: WorkspaceState = {
    projectId, isLoading, error, saveStatus, save,
    elements, connections, setElements, setConnections,
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
