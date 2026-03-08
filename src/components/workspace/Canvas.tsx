import React, { useState, useEffect, useCallback, useRef } from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements from './CanvasElements';
import { CanvasElement } from './types/canvas';
import { useCanvasInteraction, screenToWorld } from '@/hooks/useCanvasInteraction';
import { useConnections, Connection } from '@/hooks/useConnections';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import MultiSelectSettings from './MultiSelectSettings';
import ValidationPanel from './ValidationPanel';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface CanvasProps {
  className?: string;
  onSave?: () => void;
}

export interface CanvasRef {
  tidyLayout: () => void;
  getViewport: () => { x: number; y: number; zoom: number };
}

const GRID_SIZE = 25;
const SNAP_SIZE = 25; // snap-to-grid increment

const generateId = (type: string) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Node sizes for selection/connection calculations (world coords)
const NODE_SIZES: Record<string, { w: number; h: number }> = {
  campaign: { w: 288, h: 140 },
  adset: { w: 264, h: 130 },
  ad: { w: 240, h: 120 },
};

const Canvas = React.forwardRef<CanvasRef, CanvasProps>(({
  className = '',
  onSave,
}, ref) => {
  const {
    elements, connections, setElements, setConnections,
    selectedElementIds, setSelectedElementIds,
    markDirty, addCampaign, addAdSet, addAd, viewportRef,
    undo, redo, pushSnapshot,
  } = useWorkspace();

  const {
    containerRef, viewport, setViewport,
    scale, isDragging, pan, spacePressed,
    selectionRect, isSelecting,
    handleZoomIn, handleZoomOut,
    handleMouseDown: canvasMouseDown,
    handleMouseMove: canvasMouseMove,
    handleMouseUp: canvasMouseUp,
    handleCopy, handlePaste, handleDuplicate,
  } = useCanvasInteraction();

  const {
    isCreatingConnection, activeConnection,
    startConnection, completeConnection, cancelConnection,
    removeConnection, setConnections: setLocalConns,
  } = useConnections();

  useEffect(() => { setLocalConns(connections); }, [connections, setLocalConns]);

  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [pendingAffected, setPendingAffected] = useState<CanvasElement[]>([]);
  const [pendingDirectTargets, setPendingDirectTargets] = useState<CanvasElement[]>([]);

  // Hydrate viewport from saved state
  useEffect(() => {
    const vp = viewportRef.current;
    setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync viewport back to workspace context
  useEffect(() => {
    viewportRef.current = { x: pan.x, y: pan.y, zoom: scale };
  }, [pan, scale, viewportRef]);

  // Track mouse position in world coordinates for connection line preview
  const [worldMousePos, setWorldMousePos] = useState({ x: 0, y: 0 });
  // Use a ref for viewport in the mousemove handler to avoid stale closures
  const vpRef = useRef(viewport);
  vpRef.current = viewport;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    canvasMouseMove(e);
    // Update world mouse position for in-progress connections
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setWorldMousePos(screenToWorld(e.clientX, e.clientY, rect, vpRef.current));
    }
  }, [canvasMouseMove, containerRef]);

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const [showMultiSettings, setShowMultiSettings] = useState(false);

  const updateElementPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, position } : el));
  }, [setElements]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Node click handlers call stopPropagation, so any click reaching
    // here is on empty canvas — no fragile target check needed.
    if (e.target === e.currentTarget || !(e.target as HTMLElement).closest?.('[data-node-element]')) {
      setSelectedElementIds([]);
      setShowMultiSettings(false);
      if (isCreatingConnection) cancelConnection();
    }
  };

  // Rectangle selection
  useEffect(() => {
    if (!isSelecting && selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
      const selectedIds = elements.filter(element => {
        const { x, y } = element.position;
        const size = NODE_SIZES[element.type] || { w: 256, h: 120 };
        return !(
          x + size.w < selectionRect.startX ||
          x > selectionRect.startX + selectionRect.width ||
          y + size.h < selectionRect.startY ||
          y > selectionRect.startY + selectionRect.height
        );
      }).map(el => el.id);

      if (selectedIds.length > 0) {
        setSelectedElementIds(selectedIds);
        if (selectedIds.length > 1) setShowMultiSettings(true);
        toast.success(`Selected ${selectedIds.length} element${selectedIds.length > 1 ? 's' : ''}`);
      } else {
        setSelectedElementIds([]);
        setShowMultiSettings(false);
      }
    }
  }, [isSelecting, selectionRect, elements, setSelectedElementIds]);

  const handleSelectElement = (id: string) => {
    if (selectedElementIds.includes(id)) {
      setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    } else {
      setSelectedElementIds([id]);
    }
    setShowMultiSettings(false);
  };

  const updateMultipleElements = (updates: Partial<CanvasElement>) => {
    pushSnapshot();
    setElements(prev => prev.map(el => selectedElementIds.includes(el.id) ? { ...el, ...updates } : el));
    markDirty();
    toast.success(`Updated ${selectedElementIds.length} elements`);
  };

  const updateIndividualElement = (elementId: string, updates: Partial<CanvasElement>) => {
    pushSnapshot();
    setElements(prev => prev.map(el => el.id === elementId ? { ...el, ...updates } : el));
    markDirty();
  };

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
    setShowMultiSettings(false);
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
  const handleDeleteMultiple = useCallback((ids: string[]) => requestDelete(ids), [requestDelete]);
  const handleConfirmDelete = useCallback(() => {
    executeDelete(pendingDeleteIds);
    setDeleteConfirmOpen(false);
  }, [pendingDeleteIds, executeDelete]);

  const handleDuplicateElement = useCallback((id: string) => {
    pushSnapshot();
    setElements(prev => {
      const source = prev.find(el => el.id === id);
      if (!source) return prev;
      const newElement: CanvasElement = {
        ...source,
        id: generateId(source.type),
        name: `${source.name} (copy)`,
        position: { x: source.position.x + 30, y: source.position.y + 30 },
        config: source.config ? JSON.parse(JSON.stringify(source.config)) : {},
      };
      markDirty();
      toast.success(`Duplicated ${source.type}`);
      return [...prev, newElement];
    });
  }, [pushSnapshot, markDirty, setElements]);

  const getCampaigns = useCallback(() =>
    elements.filter(el => el.type === 'campaign').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  const getAdSets = useCallback(() =>
    elements.filter(el => el.type === 'adset').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  const tidyLayout = () => {
    pushSnapshot();
    const campaigns = elements.filter(el => el.type === 'campaign');
    const adsets = elements.filter(el => el.type === 'adset');
    const ads = elements.filter(el => el.type === 'ad');

    const startX = 100, startY = 100, horizontalSpacing = 350, verticalSpacing = 175;
    const newElements = elements.map(el => ({ ...el }));

    campaigns.forEach((campaign, index) => {
      const element = newElements.find(el => el.id === campaign.id);
      if (element) element.position = { x: startX, y: startY + index * verticalSpacing };
    });
    adsets.forEach((adset, index) => {
      const element = newElements.find(el => el.id === adset.id);
      if (element) element.position = { x: startX + horizontalSpacing, y: startY + index * verticalSpacing };
    });
    ads.forEach((ad, index) => {
      const element = newElements.find(el => el.id === ad.id);
      if (element) element.position = { x: startX + horizontalSpacing * 2, y: startY + index * verticalSpacing };
    });

    setElements(newElements);
    markDirty();
    toast.success('Layout organized successfully');
  };

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && selectedElementIds.length > 0) {
        if (e.key === 'c') {
          e.preventDefault();
          handleCopy(selectedElements);
        } else if (e.key === 'v') {
          e.preventDefault();
          const newElements = handlePaste();
          if (newElements) {
            pushSnapshot();
            const updatedEls = [...elementsRef.current, ...newElements];
            setElements(updatedEls);
            setSelectedElementIds(newElements.map(el => el.id));
            markDirty();
          }
        } else if (e.key === 'd') {
          e.preventDefault();
          const duplicatedElements = handleDuplicate(selectedElements);
          if (duplicatedElements) {
            pushSnapshot();
            const updatedEls = [...elementsRef.current, ...duplicatedElements];
            setElements(updatedEls);
            setSelectedElementIds(duplicatedElements.map(el => el.id));
            markDirty();
          }
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        handleDeleteMultiple(selectedElementIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kbShortcutsEnabled, elements, selectedElements, selectedElementIds, handleCopy, handlePaste, handleDuplicate, undo, redo, pushSnapshot, handleDeleteMultiple, markDirty, setElements, setSelectedElementIds]);

  // Handle drag end: push snapshot for undo + mark dirty
  const handleNodeDragEnd = useCallback((_id: string, _pos: { x: number; y: number }) => {
    markDirty();
  }, [markDirty]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <ZoomControls scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      <ValidationPanel />

      {showMultiSettings && selectedElementIds.length > 1 && (
        <MultiSelectSettings
          count={selectedElementIds.length}
          onClose={() => setShowMultiSettings(false)}
          onUpdate={updateMultipleElements}
          onUpdateIndividual={updateIndividualElement}
          elementTypes={selectedElements.map(el => el.type)}
          selectedElements={selectedElements}
        />
      )}

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        affectedElements={pendingAffected}
        directTargets={pendingDirectTargets}
      />

      <CanvasContextMenu elementType="" onAddCampaign={addCampaign} onAddAdSet={addAdSet} onAddAd={addAd} onSave={onSave}>
        {/* OUTER container: un-transformed, captures all mouse events */}
        <div
          ref={containerRef}
          className={`w-full h-full ${className} ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isDragging && spacePressed ? 'cursor-grabbing' : ''} relative overflow-hidden`}
          onMouseDown={canvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={canvasMouseUp}
          onMouseLeave={canvasMouseUp}
          onClick={handleCanvasClick}
        >
          {/* INNER layer: CSS transform for pan+zoom rendering */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
              position: 'absolute',
              top: 0,
              left: 0,
              // Large enough virtual canvas
              width: '10000px',
              height: '10000px',
            }}
          >
            {/* Grid */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
              data-canvas-background="true"
            >
              <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Selection rectangle (in world coordinates) */}
            {isSelecting && selectionRect && (
              <div
                className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-50"
                style={{
                  left: `${selectionRect.startX}px`,
                  top: `${selectionRect.startY}px`,
                  width: `${selectionRect.width}px`,
                  height: `${selectionRect.height}px`,
                }}
              />
            )}

            <CanvasElements
              elements={elements}
              connections={connections}
              isCreatingConnection={isCreatingConnection}
              activeConnection={activeConnection}
              selectedElementIds={selectedElementIds}
              onSelectElement={handleSelectElement}
              onStartConnection={startConnection}
              onCompleteConnection={completeConnection}
              onCancelConnection={cancelConnection}
              onRemoveConnection={removeConnection}
              onUpdatePosition={updateElementPosition}
              onEditElement={handleEditElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              getCampaigns={getCampaigns}
              getAdSets={getAdSets}
              viewport={viewport}
              containerRef={containerRef}
              snapSize={SNAP_SIZE}
              worldMousePos={worldMousePos}
              onDragEnd={handleNodeDragEnd}
            />
          </div>
        </div>
      </CanvasContextMenu>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
