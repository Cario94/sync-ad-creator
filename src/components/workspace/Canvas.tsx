import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection as RFConnection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Viewport,
  SelectionMode,
  Panel,
  PanOnScrollMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { CanvasElement } from './types/canvas';
import type { WorkspaceConnection as Connection } from '@/types/workspaceGraph';
import {
  workspaceElementsToReactFlowNodes,
  workspaceConnectionsToReactFlowEdges,
} from '@/lib/workspaceGraphMapper';
import { buildHierarchyLayout } from '@/lib/workspaceLayout';
import { toast } from 'sonner';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import ValidationPanel from './ValidationPanel';
import CanvasContextMenu from './CanvasContextMenu';

import CampaignNode from './nodes/CampaignNode';
import AdSetNode from './nodes/AdSetNode';
import AdNode from './nodes/AdNode';
import WorkspaceEdge from './edges/WorkspaceEdge';
import WorkspaceConnectionLine from './edges/WorkspaceConnectionLine';

interface CanvasProps {
  className?: string;
  onSave?: () => void;
}

export interface CanvasRef {
  tidyLayout: () => void;
  getViewport: () => { x: number; y: number; zoom: number };
}

const generateId = (type: string) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Valid connection rules
const isValidConnection = (connection: RFConnection, nodes: Node[]): boolean => {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  if (!sourceNode || !targetNode) return false;
  if (connection.source === connection.target) return false;

  return (
    (sourceNode.type === 'campaign' && targetNode.type === 'adset') ||
    (sourceNode.type === 'adset' && targetNode.type === 'ad')
  );
};

const nodeTypes: NodeTypes = {
  campaign: CampaignNode,
  adset: AdSetNode,
  ad: AdNode,
};

const edgeTypes: EdgeTypes = {
  workspace: WorkspaceEdge,
};

const SNAP_GRID: [number, number] = [25, 25];

const CanvasInner = React.forwardRef<CanvasRef, CanvasProps>(({
  className = '',
  onSave,
}, ref) => {
  const {
    elements, connections, setElements, setConnections,
    selectedElementIds, setSelectedElementIds,
    markDirty, addCampaign, addAdSet, addAd, viewportRef,
    undo, redo, pushSnapshot,
  } = useWorkspace();

  const { fitView, setViewport } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [pendingAffected, setPendingAffected] = useState<CanvasElement[]>([]);
  const [pendingDirectTargets, setPendingDirectTargets] = useState<CanvasElement[]>([]);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  // Callbacks for node data
  const handleEditElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    pushSnapshot();
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    markDirty();
  }, [pushSnapshot, setElements, markDirty]);

  // Cascade ID collection
  const collectCascadeIds = useCallback((ids: string[], currentElements: CanvasElement[]): Set<string> => {
    const conns = connectionsRef.current;
    const toRemove = new Set<string>(ids);
    const elementMap = new Map(currentElements.map(el => [el.id, el]));
    let frontier = [...ids];
    while (frontier.length > 0) {
      const nextFrontier: string[] = [];
      for (const fid of frontier) {
        const el = elementMap.get(fid);
        if (!el) continue;
        if (el.type === 'campaign' || el.type === 'adset') {
          const childIds = conns
            .filter(c => c.sourceId === fid && !toRemove.has(c.targetId))
            .map(c => c.targetId);
          for (const cid of childIds) {
            toRemove.add(cid);
            nextFrontier.push(cid);
          }
        }
      }
      frontier = nextFrontier;
    }
    return toRemove;
  }, []);

  const executeDelete = useCallback((ids: string[]) => {
    pushSnapshot();
    const currentEls = elementsRef.current;
    const currentConns = connectionsRef.current;
    const idsToRemove = collectCascadeIds(ids, currentEls);

    const newConns = currentConns.filter(
      c => !idsToRemove.has(c.sourceId) && !idsToRemove.has(c.targetId)
    );
    const newEls = currentEls.filter(el => !idsToRemove.has(el.id));

    setElements(newEls);
    setConnections(newConns);
    markDirty();
    setSelectedElementIds(prev => prev.filter(eid => !idsToRemove.has(eid)));
    toast.success(`Deleted ${idsToRemove.size} element${idsToRemove.size > 1 ? 's' : ''}`);
  }, [collectCascadeIds, setConnections, setElements, markDirty, setSelectedElementIds, pushSnapshot]);

  const requestDelete = useCallback((ids: string[]) => {
    const currentEls = elementsRef.current;
    const cascadeSet = collectCascadeIds(ids, currentEls);
    const affected = currentEls.filter(el => cascadeSet.has(el.id));
    const direct = currentEls.filter(el => ids.includes(el.id));

    if (affected.length === direct.length && affected.length === 1) {
      executeDelete(ids);
      return;
    }

    setPendingDeleteIds(ids);
    setPendingAffected(affected);
    setPendingDirectTargets(direct);
    setDeleteConfirmOpen(true);
  }, [collectCascadeIds, executeDelete]);

  const handleDeleteElement = useCallback((id: string) => requestDelete([id]), [requestDelete]);

  const handleDuplicateElement = useCallback((id: string) => {
    pushSnapshot();
    const source = elementsRef.current.find(el => el.id === id);
    if (!source) return;
    const newElement: CanvasElement = {
      ...source,
      id: generateId(source.type),
      name: `${source.name} (copy)`,
      position: { x: source.position.x + 30, y: source.position.y + 30 },
      config: source.config ? JSON.parse(JSON.stringify(source.config)) : {},
    };
    setElements(prev => [...prev, newElement]);
    markDirty();
    toast.success(`Duplicated ${source.type}`);
  }, [pushSnapshot, markDirty, setElements]);

  const campaigns = useMemo(() =>
    elements.filter(el => el.type === 'campaign').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  const adSets = useMemo(() =>
    elements.filter(el => el.type === 'adset').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  // Sync workspace elements → React Flow nodes
  useEffect(() => {
    const rfNodes = workspaceElementsToReactFlowNodes(elements, {
      onEdit: handleEditElement,
      onDelete: handleDeleteElement,
      onDuplicate: handleDuplicateElement,
      campaigns,
      adSets,
    });
    setNodes(rfNodes);
  }, [elements, campaigns, adSets, handleEditElement, handleDeleteElement, handleDuplicateElement]);

  // Sync workspace connections → React Flow edges
  useEffect(() => {
    setEdges(workspaceConnectionsToReactFlowEdges(connections));
  }, [connections]);

  // Hydrate viewport from saved state once nodes are ready
  const viewportRestoredRef = useRef(false);
  useEffect(() => {
    if (nodes.length === 0 || viewportRestoredRef.current) return;
    viewportRestoredRef.current = true;
    const vp = viewportRef.current;
    requestAnimationFrame(() => {
      setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  // Handle node position changes → sync back to workspace
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);

    // Check for position changes (drag end)
    const positionChanges = changes.filter(
      c => c.type === 'position' && c.dragging === false && c.position
    );
    if (positionChanges.length > 0) {
      pushSnapshot();
      setElements(prev => {
        const updated = [...prev];
        for (const change of positionChanges) {
          if (change.type === 'position' && change.position) {
            const idx = updated.findIndex(el => el.id === change.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], position: change.position };
            }
          }
        }
        return updated;
      });
      markDirty();
    }

    // Handle selection changes
    const selectionChanges = changes.filter(c => c.type === 'select');
    if (selectionChanges.length > 0) {
      setSelectedElementIds(prev => {
        let next = [...prev];
        for (const change of selectionChanges) {
          if (change.type === 'select') {
            if (change.selected) {
              if (!next.includes(change.id)) next.push(change.id);
            } else {
              next = next.filter(id => id !== change.id);
            }
          }
        }
        return next;
      });
    }
  }, [onNodesChange, pushSnapshot, setElements, markDirty, setSelectedElementIds]);

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);

    // Handle edge removals
    const removals = changes.filter(c => c.type === 'remove');
    if (removals.length > 0) {
      pushSnapshot();
      const removedIds = new Set(removals.map(c => c.id));
      setConnections(prev => prev.filter(c => !removedIds.has(c.id)));
      markDirty();
    }
  }, [onEdgesChange, pushSnapshot, setConnections, markDirty]);

  // Handle new connections
  const handleConnect = useCallback((connection: RFConnection) => {
    if (!isValidConnection(connection, nodes)) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      if (sourceNode) {
        const sourceLabel = sourceNode.type === 'campaign' ? 'Campaigns' : 'Ad Sets';
        const validTarget = sourceNode.type === 'campaign' ? 'Ad Sets' : 'Ads';
        toast.error(`${sourceLabel} can only connect to ${validTarget}`);
      }
      return;
    }

    // Check for duplicate
    const exists = edges.some(
      e => e.source === connection.source && e.target === connection.target
    );
    if (exists) {
      toast.error('Connection already exists');
      return;
    }

    pushSnapshot();
    const newEdge: Edge = {
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: connection.source!,
      target: connection.target!,
      type: 'workspace',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: 'hsl(var(--muted-foreground) / 0.8)',
      },
    };

    setEdges(prev => addEdge(newEdge, prev));

    // Sync to workspace
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    const newConn: Connection = {
      id: newEdge.id,
      sourceId: connection.source!,
      targetId: connection.target!,
      sourceType: (sourceNode?.type as Connection['sourceType']) ?? 'campaign',
      targetType: (targetNode?.type as Connection['targetType']) ?? 'adset',
    };
    setConnections(prev => [...prev, newConn]);
    markDirty();
    toast.success('Connection created');
  }, [nodes, edges, pushSnapshot, setEdges, setConnections, markDirty]);

  // Connection validator for React Flow
  const isValidConnectionFn = useCallback((connection: RFConnection) => {
    return isValidConnection(connection, nodes);
  }, [nodes]);

  // Save viewport on move
  const handleViewportChange = useCallback((viewport: Viewport) => {
    viewportRef.current = { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
  }, [viewportRef]);

  // Tidy layout
  const tidyLayout = useCallback(() => {
    pushSnapshot();

    const posMap = buildHierarchyLayout(elementsRef.current, connectionsRef.current);

    const newElements = elementsRef.current.map(el => {
      const pos = posMap.get(el.id);
      return pos ? { ...el, position: pos } : { ...el };
    });

    setElements(newElements);
    markDirty();

    // Fit view after layout
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
    toast.success('Layout organized successfully');
  }, [pushSnapshot, setElements, markDirty, fitView]);

  React.useImperativeHandle(ref, () => ({
    tidyLayout,
    getViewport: () => viewportRef.current,
  }), [tidyLayout, viewportRef]);

  // Keyboard shortcuts
  const { preferences: userPrefs } = useUserSettings();
  const kbShortcutsEnabled = userPrefs.keyboardShortcuts !== false;

  useEffect(() => {
    if (!kbShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if inside input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        requestDelete(selectedElementIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kbShortcutsEnabled, selectedElementIds, undo, redo, requestDelete]);

  const handleConfirmDelete = useCallback(() => {
    executeDelete(pendingDeleteIds);
    setDeleteConfirmOpen(false);
  }, [pendingDeleteIds, executeDelete]);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'workspace',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: 'hsl(var(--muted-foreground) / 0.8)',
    },
  }), []);


  const viewportModel = useMemo(() => ({
    // Trackpad / wheel: default to panning for two-finger scroll.
    panOnScroll: true,
    panOnScrollMode: PanOnScrollMode.Free,
    // Slightly faster than default for more responsive desktop navigation.
    panOnScrollSpeed: 1.1,
    // Keep zoom available, but make it intentional to avoid accidental zoom while panning.
    zoomOnScroll: true,
    zoomActivationKeyCode: ['Meta', 'Control'] as const,
    zoomOnPinch: true,
    // Reduce extreme zoom ranges for steadier navigation context.
    minZoom: 0.35,
    maxZoom: 2,
  }), []);

  const interactionModel = useMemo(() => ({
    // Primary desktop behavior: drag empty space to pan.
    panOnDrag: true as const,
    // Keep marquee selection explicit so it doesn't conflict with panning.
    selectionOnDrag: false,
    // Use one modifier model for range-select and additive selection.
    selectionKeyCode: 'Shift' as const,
    multiSelectionKeyCode: 'Shift' as const,
    // Keep middle-mouse panning available as an alternative muscle memory.
    panActivationKeyCode: 'Space' as const,
  }), []);

  return (
    <div className={`w-full h-full ${className}`}>
      <CanvasContextMenu elementType="" onAddCampaign={addCampaign} onAddAdSet={addAdSet} onAddAd={addAd} onSave={onSave}>
        <div className="w-full h-full workspace-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnectionFn}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineComponent={WorkspaceConnectionLine}
            fitView={false}
            onViewportChange={handleViewportChange}
            selectionMode={SelectionMode.Partial}
            selectNodesOnDrag={false}
            selectionOnDrag={interactionModel.selectionOnDrag}
            selectionKeyCode={interactionModel.selectionKeyCode}
            multiSelectionKeyCode={interactionModel.multiSelectionKeyCode}
            panOnDrag={interactionModel.panOnDrag}
            panActivationKeyCode={interactionModel.panActivationKeyCode}
            panOnScroll={viewportModel.panOnScroll}
            panOnScrollMode={viewportModel.panOnScrollMode}
            panOnScrollSpeed={viewportModel.panOnScrollSpeed}
            zoomOnScroll={viewportModel.zoomOnScroll}
            zoomActivationKeyCode={viewportModel.zoomActivationKeyCode}
            zoomOnPinch={viewportModel.zoomOnPinch}
            zoomOnDoubleClick={false}
            minZoom={viewportModel.minZoom}
            maxZoom={viewportModel.maxZoom}
            connectionRadius={24}
            snapToGrid
            snapGrid={SNAP_GRID}
            nodeDragThreshold={1}
            deleteKeyCode={null}
            elevateEdgesOnSelect
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={25}
              size={1}
              color="hsl(var(--border) / 0.5)"
            />
            <Controls
              showInteractive={false}
              position="bottom-right"
            />
            <MiniMap
              position="bottom-left"
              nodeStrokeWidth={3}
              pannable
              zoomable
              maskColor="hsl(var(--background) / 0.7)"
            />
            <Panel position="top-left">
              <ValidationPanel />
            </Panel>
          </ReactFlow>
        </div>
      </CanvasContextMenu>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        affectedElements={pendingAffected}
        directTargets={pendingDirectTargets}
      />
    </div>
  );
});

CanvasInner.displayName = 'CanvasInner';

// Wrap in ReactFlowProvider
const Canvas = React.forwardRef<CanvasRef, CanvasProps>((props, ref) => (
  <ReactFlowProvider>
    <CanvasInner ref={ref} {...props} />
  </ReactFlowProvider>
));

Canvas.displayName = 'Canvas';
export default Canvas;
