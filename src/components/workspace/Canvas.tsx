
import React, { useState, useEffect } from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements, { CanvasElement } from './CanvasElements';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useConnections } from '@/hooks/useConnections';
import { toast } from 'sonner';
import MultiSelectSettings from './MultiSelectSettings';

interface CanvasProps {
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ className = '' }) => {
  // State for canvas elements
  const [elements, setElements] = useState<CanvasElement[]>([
    { id: 'campaign-1', type: 'campaign', name: 'Summer Sale 2023', position: { x: 100, y: 100 } },
    { id: 'adset-1', type: 'adset', name: 'Women 25-34', position: { x: 400, y: 200 } },
    { id: 'ad-1', type: 'ad', name: 'Product Showcase', position: { x: 700, y: 300 } },
  ]);
  
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
    removeConnection
  } = useConnections();
  
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
    // Only deselect if the click is directly on the canvas (not on an element)
    if (e.target === e.currentTarget) {
      setSelectedElementIds([]);
      setShowMultiSettings(false);
    }
  };
  
  // Complete selection with rectangle
  useEffect(() => {
    if (!isSelecting && selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
      // Find all elements that are within the selection rectangle
      const selectedIds = elements.filter(element => {
        const { x, y } = element.position;
        const isWithinSelection = 
          x >= selectionRect.startX && 
          x <= selectionRect.startX + selectionRect.width &&
          y >= selectionRect.startY && 
          y <= selectionRect.startY + selectionRect.height;
        
        return isWithinSelection;
      }).map(el => el.id);
      
      if (selectedIds.length > 0) {
        setSelectedElementIds(selectedIds);
        if (selectedIds.length > 1) {
          setShowMultiSettings(true);
        }
      }
    }
  }, [isSelecting, selectionRect, elements]);
  
  // Handle selection of a single element
  const handleSelectElement = (id: string) => {
    // If holding shift, add to selection
    if (selectedElementIds.includes(id)) {
      setSelectedElementIds(prev => prev.filter(elementId => elementId !== id));
    } else {
      setSelectedElementIds([id]);
    }
    
    setShowMultiSettings(false);
  };
  
  // Handle updating multiple selected elements
  const updateMultipleElements = (updates: Partial<CanvasElement>) => {
    setElements(prev => 
      prev.map(el => 
        selectedElementIds.includes(el.id) 
          ? { ...el, ...updates } 
          : el
      )
    );
    
    toast.success(`Updated ${selectedElementIds.length} elements`);
    addToHistory(elements);
  };
  
  // Add keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && selectedElementIds.length > 0) {
        if (e.key === 'c') {
          // Copy
          e.preventDefault();
          handleCopy(selectedElements);
        } else if (e.key === 'v') {
          // Paste
          e.preventDefault();
          const newElements = handlePaste();
          if (newElements) {
            setElements(prev => [...prev, ...newElements]);
            setSelectedElementIds(newElements.map(el => el.id));
            addToHistory([...elements, ...newElements]);
          }
        } else if (e.key === 'd') {
          // Duplicate
          e.preventDefault();
          const duplicatedElements = handleDuplicate(selectedElements);
          if (duplicatedElements) {
            setElements(prev => [...prev, ...duplicatedElements]);
            setSelectedElementIds(duplicatedElements.map(el => el.id));
            addToHistory([...elements, ...duplicatedElements]);
          }
        }
      }
      
      // Handle Delete/Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        
        // Remove the selected elements
        setElements(prev => prev.filter(el => !selectedElementIds.includes(el.id)));
        
        // Remove any connections involving the deleted elements
        if (connections.some(conn => 
          selectedElementIds.includes(conn.sourceId) || 
          selectedElementIds.includes(conn.targetId)
        )) {
          connections
            .filter(conn => 
              selectedElementIds.includes(conn.sourceId) || 
              selectedElementIds.includes(conn.targetId)
            )
            .forEach(conn => removeConnection(conn.id));
        }
        
        setSelectedElementIds([]);
        setShowMultiSettings(false);
        toast.success(`${selectedElementIds.length} element(s) deleted`);
        addToHistory(elements.filter(el => !selectedElementIds.includes(el.id)));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [elements, selectedElements, selectedElementIds, handleCopy, handlePaste, handleDuplicate, addToHistory, connections, removeConnection]);
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-secondary/20">
      {/* Zoom controls */}
      <ZoomControls 
        scale={scale} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
      />
      
      {/* Multi-select settings dialog */}
      {showMultiSettings && selectedElementIds.length > 1 && (
        <MultiSelectSettings 
          count={selectedElementIds.length}
          onClose={() => setShowMultiSettings(false)}
          onUpdate={updateMultipleElements}
          elementTypes={selectedElements.map(el => el.type)}
        />
      )}
      
      <CanvasContextMenu elementType="">
        <div 
          ref={canvasRef}
          className={`workspace-canvas w-full h-full ${className} ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isDragging && spacePressed ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s'
          }}
        >
          {/* Selection rectangle */}
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
          
          {/* Render workspace elements with connections */}
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
};

export default Canvas;
