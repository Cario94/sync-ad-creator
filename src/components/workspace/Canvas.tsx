import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
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
import type { WorkspaceFlowNodeData } from '@/lib/workspaceGraphMapper';
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
import ResizableMiniMap from './ResizableMiniMap';

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
    nodes, edges, setNodes, setEdges, elements, connections,
    selectedElementIds, setSelectedElementIds,
    markDirty, addCampaign, addAdSet, addAd, viewportRef,
    undo, redo, pushSnapshot,
  } = useWorkspace();

  const { fitView, setViewport } = useReactFlow();

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
    setNodes(prev => prev.map(node => node.id === id
      ? {
        ...node,
        data: {
          ...node.data,
          label: updates.name ?? node.data.label,
          config: updates.config ?? node.data.config,
        },
      }
      : node));
    markDirty();
  }, [pushSnapshot, setNodes, markDirty]);

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
    const idsToRemove = collectCascadeIds(ids, currentEls);

    const removeSet = idsToRemove;
    setNodes(prev => prev.filter(node => !removeSet.has(node.id)));
    setEdges(prev => prev.filter(edge => !removeSet.has(edge.source) && !removeSet.has(edge.target)));
    markDirty();
    setSelectedElementIds(prev => prev.filter(eid => !idsToRemove.has(eid)));
    toast.success(`Deleted ${idsToRemove.size} element${idsToRemove.size > 1 ? 's' : ''}`);
  }, [collectCascadeIds, setNodes, setEdges, markDirty, setSelectedElementIds, pushSnapshot]);

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
    const duplicatedNode: Node<WorkspaceFlowNodeData> = {
      id: newElement.id,
      type: newElement.type,
      position: newElement.position,
      data: { label: newElement.name, config: newElement.config ?? {}, elementId: newElement.id },
    };
    setNodes(prev => [...prev, duplicatedNode]);
    markDirty();
    toast.success(`Duplicated ${source.type}`);
  }, [pushSnapshot, markDirty, setNodes]);

  const campaigns = useMemo(() =>
    elements.filter(el => el.type === 'campaign').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  const adSets = useMemo(() =>
    elements.filter(el => el.type === 'adset').map(el => ({ id: el.id, name: el.name })),
  [elements]);


  const renderNodes = useMemo(() => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onEdit: handleEditElement,
      onDelete: handleDeleteElement,
      onDuplicate: handleDuplicateElement,
      campaigns,
      adSets,
    },
  })), [nodes, handleEditElement, handleDeleteElement, handleDuplicateElement, campaigns, adSets]);

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

  // Handle node changes (React Flow is the live editing source-of-truth)
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes(prev => applyNodeChanges(changes, prev) as Node<WorkspaceFlowNodeData>[]);

    const hasPositionChange = changes.some(c => c.type === 'position' && c.position);
    if (hasPositionChange) {
      pushSnapshot();
      markDirty();
    }

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
  }, [setNodes, pushSnapshot, markDirty, setSelectedElementIds]);

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges(prev => applyEdgeChanges(changes, prev));

    // Handle edge removals
    const removals = changes.filter(c => c.type === 'remove');
    if (removals.length > 0) {
      pushSnapshot();
      markDirty();
    }
  }, [setEdges, pushSnapshot, markDirty]);

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

    markDirty();
    toast.success('Connection created');
  }, [nodes, edges, pushSnapshot, setEdges, markDirty]);

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

    setNodes(prev => prev.map(node => {
      const pos = posMap.get(node.id);
      return pos ? { ...node, position: pos } : node;
    }));
    markDirty();

    // Fit view after layout
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
    toast.success('Layout organized successfully');
  }, [pushSnapshot, setNodes, markDirty, fitView]);

  React.useImperativeHandle(ref, () => ({
    tidyLayout,
    getViewport: () => viewportRef.current,
  }), [tidyLayout, viewportRef]);

  // Clipboard state for copy/paste
  const clipboardRef = useRef<Node<WorkspaceFlowNodeData>[]>([]);

  const copySelected = useCallback(() => {
    const selected = nodes.filter(n => selectedElementIds.includes(n.id));
    if (selected.length === 0) return;
    clipboardRef.current = selected.map(n => JSON.parse(JSON.stringify(n)));
    toast.success(`Copied ${selected.length} element${selected.length > 1 ? 's' : ''}`);
  }, [nodes, selectedElementIds]);

  const pasteClipboard = useCallback(() => {
    if (clipboardRef.current.length === 0) return;
    pushSnapshot();
    const newNodes: Node<WorkspaceFlowNodeData>[] = clipboardRef.current.map(n => {
      const newId = generateId(n.type || 'node');
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 50, y: n.position.y + 50 },
        selected: false,
        data: { ...n.data, label: `${n.data.label} (copy)`, elementId: newId },
      };
    });
    setNodes(prev => [...prev, ...newNodes]);
    markDirty();
    toast.success(`Pasted ${newNodes.length} element${newNodes.length > 1 ? 's' : ''}`);
  }, [pushSnapshot, setNodes, markDirty]);

  const duplicateSelected = useCallback(() => {
    const selected = nodes.filter(n => selectedElementIds.includes(n.id));
    if (selected.length === 0) return;
    pushSnapshot();
    const newNodes: Node<WorkspaceFlowNodeData>[] = selected.map(n => {
      const newId = generateId(n.type || 'node');
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 30, y: n.position.y + 30 },
        selected: false,
        data: { ...n.data, label: `${n.data.label} (copy)`, elementId: newId },
      };
    });
    setNodes(prev => [...prev, ...newNodes]);
    markDirty();
    toast.success(`Duplicated ${newNodes.length} element${newNodes.length > 1 ? 's' : ''}`);
  }, [nodes, selectedElementIds, pushSnapshot, setNodes, markDirty]);

  // Keyboard shortcuts
  const { preferences: userPrefs } = useUserSettings();
  const kbShortcutsEnabled = userPrefs.keyboardShortcuts !== false;

  useEffect(() => {
    if (!kbShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if inside input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }

      if (mod && e.key === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }

      if (mod && e.key === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      if (mod && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        requestDelete(selectedElementIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kbShortcutsEnabled, selectedElementIds, undo, redo, requestDelete, copySelected, pasteClipboard, duplicateSelected]);

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
    // Trackpad two-finger gesture = pan (via panOnScroll).
    panOnScroll: true,
    panOnScrollMode: PanOnScrollMode.Free,
    panOnScrollSpeed: 2.5,
    // Zoom only via pinch or Ctrl/Cmd+scroll.
    zoomOnScroll: false,
    zoomOnPinch: true,
    minZoom: 0.1,
    maxZoom: 3,
  }), []);

  const interactionModel = useMemo(() => ({
    // Click+drag on empty canvas = marquee selection (NOT pan).
    // Use [1,2] to allow middle-mouse panning as well.
    panOnDrag: [1, 2] as number[],
    selectionOnDrag: true,
    selectionMode: SelectionMode.Partial,
    // Shift for additive multi-select.
    multiSelectionKeyCode: 'Shift' as const,
    // Space+drag for manual panning with left click.
    panActivationKeyCode: 'Space' as const,
  }), []);

  return (
    <div className={`w-full h-full ${className}`}>
      <CanvasContextMenu elementType="" onAddCampaign={addCampaign} onAddAdSet={addAdSet} onAddAd={addAd} onSave={onSave}>
        <div className="w-full h-full workspace-flow">
          <ReactFlow
            nodes={renderNodes}
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
            selectionMode={interactionModel.selectionMode}
            selectNodesOnDrag={false}
            selectionOnDrag={interactionModel.selectionOnDrag}
            selectionKeyCode={null}
            multiSelectionKeyCode={interactionModel.multiSelectionKeyCode}
            panOnDrag={interactionModel.panOnDrag}
            panActivationKeyCode={interactionModel.panActivationKeyCode}
            panOnScroll={viewportModel.panOnScroll}
            panOnScrollMode={viewportModel.panOnScrollMode}
            panOnScrollSpeed={viewportModel.panOnScrollSpeed}
            zoomOnScroll={viewportModel.zoomOnScroll}
            zoomOnPinch={viewportModel.zoomOnPinch}
            zoomOnDoubleClick={false}
            minZoom={viewportModel.minZoom}
            maxZoom={viewportModel.maxZoom}
            connectionRadius={24}
            snapToGrid
            snapGrid={SNAP_GRID}
            nodeDragThreshold={2}
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
            <Panel position="bottom-left">
              <ResizableMiniMap />
            </Panel>
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
