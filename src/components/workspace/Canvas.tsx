
import React, { useState, useEffect, useCallback } from 'react';
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

// Expose Canvas methods via ref
interface CanvasRef {
  tidyLayout: () => void;
  getElements: () => CanvasElement[];
  getConnections: () => Connection[];
  getViewport: () => { x: number; y: number; zoom: number };
  addElement: (element: CanvasElement) => void;
}

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
  // State for canvas elements – start empty, populated via initialElements
  const [elements, setElements] = useState<CanvasElement[]>([]);
  
  // Use the custom hook for all canvas interactions
  const {
    canvasRef,
    scale,
    isDragging,
    pan,
    spacePressed,
    selectionRect,
    isSelecting,
    handleZoomIn,
    handleZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setScale,
    setPan,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleUndo,
    handleRedo,
    addToHistory
  } = useCanvasInteraction();
  
  // Use connections hook
  const {
    connections,
    isCreatingConnection,
    activeConnection,
    startConnection,
    completeConnection,
    cancelConnection,
    removeConnection,
    setConnections
  } = useConnections();

  // Hydrate from DB when initial data arrives
  useEffect(() => {
    if (initialElements) {
      setElements(initialElements);
    }
  }, [initialElements]);

  useEffect(() => {
    if (initialConnections) {
      setConnections(initialConnections);
    }
  }, [initialConnections]);

  useEffect(() => {
    if (initialViewport) {
      setPan({ x: initialViewport.x, y: initialViewport.y });
      setScale(initialViewport.zoom);
    }
  }, [initialViewport]);

  // Notify parent of changes
  useEffect(() => {
    onElementsChange?.(elements);
  }, [elements]);

  useEffect(() => {
    onConnectionsChange?.(connections);
  }, [connections]);
  
  // Add state for selected elements
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  
  // Get the selected elements
  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  
  // Multi-select settings dialog state
  const [showMultiSettings, setShowMultiSettings] = useState(false);
  
  // Update element position when dragged
  const updateElementPosition = (id: string, position: { x: number; y: number }) => {
    setElements(prev => 
      prev.map(el => el.id === id ? { ...el, position } : el)
    );
  };
  
  // Handle canvas background click to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElementIds([]);
      setShowMultiSettings(false);
    }
  };
  
  // Complete selection with rectangle  
  useEffect(() => {
    if (!isSelecting && selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
      const selectedIds = elements.filter(element => {
        const { x, y } = element.position;
        const elementWidth = 256;
        const elementHeight = element.type === 'campaign' ? 140 : element.type === 'adset' ? 130 : 120;
        
        const elementLeft = x;
        const elementRight = x + elementWidth;
        const elementTop = y;
        const elementBottom = y + elementHeight;
        
        const selectionLeft = selectionRect.startX;
        const selectionRight = selectionRect.startX + selectionRect.width;
        const selectionTop = selectionRect.startY;
        const selectionBottom = selectionRect.startY + selectionRect.height;
        
        return !(
          elementRight < selectionLeft ||
          elementLeft > selectionRight ||
          elementBottom < selectionTop ||
          elementTop > selectionBottom
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
    if (!isSelecting && selectionRect) {
      const timer = setTimeout(() => {}, 50);
      return () => clearTimeout(timer);
    }
  }, [isSelecting, selectionRect, elements]);
  
  const handleSelectElement = (id: string) => {
    if (selectedElementIds.includes(id)) {
      setSelectedElementIds(prev => prev.filter(elementId => elementId !== id));
    } else {
      setSelectedElementIds([id]);
    }
    setShowMultiSettings(false);
  };
  
  const updateMultipleElements = (updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const updated = prev.map(el => 
        selectedElementIds.includes(el.id) ? { ...el, ...updates } : el
      );
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

  // Add element programmatically
  const addElement = useCallback((element: CanvasElement) => {
    setElements(prev => {
      const updated = [...prev, element];
      addToHistory(updated);
      return updated;
    });
    setSelectedElementIds([element.id]);
  }, [addToHistory]);

  // Expose methods via ref — must include all deps to avoid stale closures
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
        const newElements = elements.filter(el => !selectedElementIds.includes(el.id));
        setElements(newElements);
        connections
          .filter(conn => selectedElementIds.includes(conn.sourceId) || selectedElementIds.includes(conn.targetId))
          .forEach(conn => removeConnection(conn.id));
        setSelectedElementIds([]);
        setShowMultiSettings(false);
        toast.success(`Deleted ${selectedElementIds.length} element(s)`);
        addToHistory(newElements);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedElements, selectedElementIds, handleCopy, handlePaste, handleDuplicate, handleUndo, handleRedo, addToHistory, connections, removeConnection, onUndo, onRedo]);
  
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
      
      <CanvasContextMenu elementType="">
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
          />
        </div>
      </CanvasContextMenu>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
export type { CanvasRef };
