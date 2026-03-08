import React, { useState, useEffect, useCallback, useRef } from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements from './CanvasElements';
import { CanvasElement } from './types/canvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useConnections, Connection } from '@/hooks/useConnections';
import { toast } from 'sonner';
import MultiSelectSettings from './MultiSelectSettings';

interface CanvasProps {
  className?: string;
  initialElements?: CanvasElement[];
  initialConnections?: Connection[];
  initialViewport?: { x: number; y: number; zoom: number };
  onElementsChange?: (elements: CanvasElement[]) => void;
  onConnectionsChange?: (connections: Connection[]) => void;
  onAddCampaign?: () => void;
  onAddAdSet?: () => void;
  onAddAd?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onTidyLayout?: () => void;
}

interface CanvasRef {
  tidyLayout: () => void;
  getElements: () => CanvasElement[];
  getConnections: () => Connection[];
  getViewport: () => { x: number; y: number; zoom: number };
  addElement: (element: CanvasElement) => void;
}

const generateId = (type: string) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const Canvas = React.forwardRef<CanvasRef, CanvasProps>(({
  className = '',
  initialElements,
  initialConnections,
  initialViewport,
  onElementsChange,
  onConnectionsChange,
  onAddCampaign,
  onAddAdSet,
  onAddAd,
  onSave,
  onUndo,
  onRedo,
  onTidyLayout
}, ref) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  
  const {
    canvasRef, scale, isDragging, pan, spacePressed,
    selectionRect, isSelecting,
    handleZoomIn, handleZoomOut,
    handleMouseDown, handleMouseMove, handleMouseUp,
    setScale, setPan,
    handleCopy, handlePaste, handleDuplicate,
    handleUndo, handleRedo, addToHistory
  } = useCanvasInteraction();
  
  const {
    connections, isCreatingConnection, activeConnection,
    startConnection, completeConnection, cancelConnection,
    removeConnection, setConnections
  } = useConnections();

  // Keep a ref to connections so callbacks always see current value
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  // Hydrate from DB
  useEffect(() => {
    if (initialElements) setElements(initialElements);
  }, [initialElements]);

  useEffect(() => {
    if (initialConnections) setConnections(initialConnections);
  }, [initialConnections]);

  useEffect(() => {
    if (initialViewport) {
      setPan({ x: initialViewport.x, y: initialViewport.y });
      setScale(initialViewport.zoom);
    }
  }, [initialViewport]);

  // Notify parent of changes
  useEffect(() => { onElementsChange?.(elements); }, [elements]);
  useEffect(() => { onConnectionsChange?.(connections); }, [connections]);
  
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
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
  }, [isSelecting, selectionRect, elements]);
  
  const handleSelectElement = (id: string) => {
    if (selectedElementIds.includes(id)) {
      setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    } else {
      setSelectedElementIds([id]);
    }
    setShowMultiSettings(false);
  };
  
  const updateMultipleElements = (updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const updated = prev.map(el => selectedElementIds.includes(el.id) ? { ...el, ...updates } : el);
      addToHistory(updated);
      return updated;
    });
    toast.success(`Updated ${selectedElementIds.length} elements`);
  };

  const updateIndividualElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const updated = prev.map(el => el.id === elementId ? { ...el, ...updates } : el);
      addToHistory(updated);
      return updated;
    });
  };

  // ── Edit element (from dialog save) ──
  const handleEditElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const updated = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      addToHistory(updated);
      return updated;
    });
  }, [addToHistory]);

  // ── Cascade delete — collects all IDs to remove in one pass ──
  const collectCascadeIds = useCallback((ids: string[], currentElements: CanvasElement[]): Set<string> => {
    const conns = connectionsRef.current;
    const toRemove = new Set<string>(ids);
    const elementMap = new Map(currentElements.map(el => [el.id, el]));

    // Iteratively expand: if a campaign is being removed, also remove connected adsets,
    // and if an adset is being removed, also remove connected ads.
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

  const handleDeleteElement = useCallback((id: string) => {
    setElements(prev => {
      const idsToRemove = collectCascadeIds([id], prev);

      // Clean up connections referencing removed elements
      const conns = connectionsRef.current;
      conns
        .filter(c => idsToRemove.has(c.sourceId) || idsToRemove.has(c.targetId))
        .forEach(c => removeConnection(c.id));

      const updated = prev.filter(el => !idsToRemove.has(el.id));
      addToHistory(updated);

      toast.success(`Deleted ${idsToRemove.size} element${idsToRemove.size > 1 ? 's' : ''}`);
      return updated;
    });

    setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    setShowMultiSettings(false);
  }, [collectCascadeIds, removeConnection, addToHistory]);

  /** Batch delete for multi-select (single setElements call) */
  const handleDeleteMultiple = useCallback((ids: string[]) => {
    setElements(prev => {
      const idsToRemove = collectCascadeIds(ids, prev);

      const conns = connectionsRef.current;
      conns
        .filter(c => idsToRemove.has(c.sourceId) || idsToRemove.has(c.targetId))
        .forEach(c => removeConnection(c.id));

      const updated = prev.filter(el => !idsToRemove.has(el.id));
      addToHistory(updated);

      toast.success(`Deleted ${idsToRemove.size} element${idsToRemove.size > 1 ? 's' : ''}`);
      return updated;
    });

    setSelectedElementIds([]);
    setShowMultiSettings(false);
  }, [collectCascadeIds, removeConnection, addToHistory]);

  // ── Duplicate element ──
  const handleDuplicateElement = useCallback((id: string) => {
    setElements(prev => {
      const source = prev.find(el => el.id === id);
      if (!source) return prev;

      const newElement: CanvasElement = {
        ...source,
        id: generateId(source.type),
        name: `${source.name} (copy)`,
        position: { x: source.position.x + 30, y: source.position.y + 30 },
        config: source.config ? { ...source.config } : {},
      };

      const updated = [...prev, newElement];
      addToHistory(updated);
      toast.success(`Duplicated ${source.type}`);
      return updated;
    });
  }, [addToHistory]);

  // ── Helpers for child dialogs ──
  const getCampaigns = useCallback(() => 
    elements.filter(el => el.type === 'campaign').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  const getAdSets = useCallback(() => 
    elements.filter(el => el.type === 'adset').map(el => ({ id: el.id, name: el.name })),
  [elements]);

  const tidyLayout = () => {
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
    addToHistory(newElements);
    onTidyLayout?.();
    toast.success('Layout organized successfully');
  };

  const addElement = useCallback((element: CanvasElement) => {
    // Ensure config is always present
    const el: CanvasElement = { ...element, config: element.config ?? {} };
    setElements(prev => {
      const updated = [...prev, el];
      addToHistory(updated);
      return updated;
    });
    setSelectedElementIds([el.id]);
  }, [addToHistory]);

  React.useImperativeHandle(ref, () => ({
    tidyLayout,
    getElements: () => elements,
    getConnections: () => connections,
    getViewport: () => ({ x: pan.x, y: pan.y, zoom: scale }),
    addElement,
  }), [elements, connections, pan, scale, tidyLayout, addElement]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && selectedElementIds.length > 0) {
        if (e.key === 'c') {
          e.preventDefault();
          handleCopy(selectedElements);
        } else if (e.key === 'v') {
          e.preventDefault();
          const newElements = handlePaste();
          if (newElements) {
            setElements(prev => [...prev, ...newElements]);
            setSelectedElementIds(newElements.map(el => el.id));
            addToHistory([...elements, ...newElements]);
          }
        } else if (e.key === 'd') {
          e.preventDefault();
          const duplicatedElements = handleDuplicate(selectedElements);
          if (duplicatedElements) {
            setElements(prev => [...prev, ...duplicatedElements]);
            setSelectedElementIds(duplicatedElements.map(el => el.id));
            addToHistory([...elements, ...duplicatedElements]);
          }
        } else if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            const state = handleRedo();
            if (state) { setElements(state); onRedo?.(); }
          } else {
            const state = handleUndo();
            if (state) { setElements(state); onUndo?.(); }
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
  }, [elements, selectedElements, selectedElementIds, handleCopy, handlePaste, handleDuplicate, handleUndo, handleRedo, addToHistory, onUndo, onRedo, handleDeleteMultiple]);
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <ZoomControls scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      
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
      
      <CanvasContextMenu elementType="" onAddCampaign={onAddCampaign} onAddAdSet={onAddAdSet} onAddAd={onAddAd} onSave={onSave}>
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
            willChange: 'transform'
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
                height: `${selectionRect.height}px`
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
export type { CanvasRef };
