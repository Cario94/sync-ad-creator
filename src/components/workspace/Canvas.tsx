import React, { useState, useEffect, useCallback, useRef } from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements from './CanvasElements';
import { CanvasElement } from './types/canvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
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

const generateId = (type: string) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
    canvasRef, scale, isDragging, pan, spacePressed,
    selectionRect, isSelecting,
    handleZoomIn, handleZoomOut,
    handleMouseDown, handleMouseMove, handleMouseUp,
    setScale, setPan,
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

  // Hydrate viewport
  useEffect(() => {
    const vp = viewportRef.current;
    setPan({ x: vp.x, y: vp.y });
    setScale(vp.zoom);
  }, []);

  useEffect(() => {
    viewportRef.current = { x: pan.x, y: pan.y, zoom: scale };
  }, [pan, scale, viewportRef]);

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const [showMultiSettings, setShowMultiSettings] = useState(false);

  const updateElementPosition = (id: string, position: { x: number; y: number }) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, position } : el));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElementIds([]);
      setShowMultiSettings(false);
    }
  };

  // Rectangle selection
  useEffect(() => {
    if (!isSelecting && selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
      const selectedIds = elements.filter(element => {
        const { x, y } = element.position;
        const elementWidth = 256;
        const elementHeight = element.type === 'campaign' ? 140 : element.type === 'adset' ? 130 : 120;
        return !(
          x + elementWidth < selectionRect.startX ||
          x > selectionRect.startX + selectionRect.width ||
          y + elementHeight < selectionRect.startY ||
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

    const startX = 100, startY = 100, horizontalSpacing = 350, verticalSpacing = 150;
    const newElements = [...elements];

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
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
  }, [elements, selectedElements, selectedElementIds, handleCopy, handlePaste, handleDuplicate, undo, redo, pushSnapshot, handleDeleteMultiple, markDirty, setElements, setSelectedElementIds]);

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
        <div
          ref={canvasRef}
          className={`workspace-canvas w-full h-full ${className} ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isDragging && spacePressed ? 'cursor-grabbing' : ''} relative`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging || isSelecting ? 'none' : 'transform 0.05s ease-out',
            willChange: 'transform',
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0, minWidth: '200%', minHeight: '200%', left: '-50%', top: '-50%' }}
          >
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

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
          />
        </div>
      </CanvasContextMenu>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
