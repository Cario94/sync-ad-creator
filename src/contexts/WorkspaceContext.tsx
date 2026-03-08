import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectDocument, type ProjectDocumentState, type SaveStatus, type StoredEdge } from '@/hooks/useProjectDocument';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import { defaultCampaignConfig, defaultAdSetConfig, defaultAdConfig } from '@/components/workspace/types/canvas';
import type { Connection } from '@/hooks/useConnections';
import { toast } from 'sonner';

// ── Types ──

export interface WorkspaceState {
  // Project
  projectId: string | null;
  isLoading: boolean;
  error: string | null;

  // Save
  saveStatus: SaveStatus;
  save: () => Promise<void>;

  // Elements & connections (source of truth)
  elements: CanvasElement[];
  connections: Connection[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;

  // Dirty tracking — call after any user-driven mutation (not hydration)
  markDirty: () => void;

  // Selection
  selectedElementIds: string[];
  setSelectedElementIds: React.Dispatch<React.SetStateAction<string[]>>;

  // Element CRUD helpers
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElements: (ids: string[]) => void;

  // Convenience factories
  addCampaign: () => void;
  addAdSet: () => void;
  addAd: () => void;

  // Viewport (stored as ref so Canvas can read/write without re-renders)
  viewportRef: React.MutableRefObject<{ x: number; y: number; zoom: number }>;
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

  // Project document hook handles loading/persisting
  const {
    projectId, documentState, isLoading, error,
    save: rawSave, saveStatus, markDirty,
  } = useProjectDocument(paramProjectId);

  // ── Source-of-truth state ──
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Track whether initial hydration from DB has completed
  const hydratedRef = useRef(false);

  // Hydrate once when documentState arrives
  useEffect(() => {
    if (!documentState) return;
    hydratedRef.current = false; // reset for new load
    setElements(documentState.elements);
    setConnections(documentState.connections as Connection[]);
    viewportRef.current = documentState.viewport;
    // Mark hydration complete after state settles (next tick)
    requestAnimationFrame(() => { hydratedRef.current = true; });
  }, [documentState]);

  // ── Dirty tracking: only mark after hydration ──
  const smartMarkDirty = useCallback(() => {
    if (hydratedRef.current) markDirty();
  }, [markDirty]);

  // ── Save: serialise current in-memory state → DB ──
  const save = useCallback(async () => {
    const state: ProjectDocumentState = {
      elements,
      connections: connections as StoredEdge[],
      viewport: viewportRef.current,
    };
    await rawSave(state);
  }, [elements, connections, rawSave]);

  // ── Element CRUD ──

  const addElement = useCallback((element: CanvasElement) => {
    const el: CanvasElement = { ...element, config: element.config ?? {} };
    setElements(prev => [...prev, el]);
    setSelectedElementIds([el.id]);
    smartMarkDirty();
  }, [smartMarkDirty]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    smartMarkDirty();
  }, [smartMarkDirty]);

  const removeElements = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setElements(prev => prev.filter(el => !idSet.has(el.id)));
    setConnections(prev => prev.filter(c => !idSet.has(c.sourceId) && !idSet.has(c.targetId)));
    setSelectedElementIds(prev => prev.filter(id => !idSet.has(id)));
    smartMarkDirty();
  }, [smartMarkDirty]);

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
  }, [findOpenPosition, smartMarkDirty]);

  const addAdSet = useCallback(() => {
    setElements(prev => {
      const campaigns = prev.filter(e => e.type === 'campaign');
      if (campaigns.length === 0) {
        toast.error('Create a Campaign first', { description: 'Ad Sets must belong to a Campaign.' });
        return prev;
      }
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
  }, [findOpenPosition, smartMarkDirty]);

  const addAd = useCallback(() => {
    setElements(prev => {
      const adSets = prev.filter(e => e.type === 'adset');
      if (adSets.length === 0) {
        toast.error('Create an Ad Set first', { description: 'Ads must belong to an Ad Set.' });
        return prev;
      }
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
  }, [findOpenPosition, smartMarkDirty]);

  const value: WorkspaceState = {
    projectId,
    isLoading,
    error,
    saveStatus,
    save,
    elements,
    connections,
    setElements,
    setConnections,
    markDirty: smartMarkDirty,
    selectedElementIds,
    setSelectedElementIds,
    addElement,
    updateElement,
    removeElements,
    addCampaign,
    addAdSet,
    addAd,
    viewportRef,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
