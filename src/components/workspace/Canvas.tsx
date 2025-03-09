
import React, { useState, useEffect } from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements, { CanvasElement } from './CanvasElements';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useConnections } from '@/hooks/useConnections';
import { toast } from 'sonner';

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
  
  // Add state for selected element
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Get the selected element object
  const selectedElement = selectedElementId 
    ? elements.find(el => el.id === selectedElementId) 
    : null;
  
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
      setSelectedElementId(null);
    }
  };
  
  // Add keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && selectedElement) {
        if (e.key === 'c') {
          // Copy
          e.preventDefault();
          handleCopy(selectedElement);
        } else if (e.key === 'v') {
          // Paste
          e.preventDefault();
          const newElement = handlePaste();
          if (newElement) {
            setElements(prev => [...prev, newElement]);
            setSelectedElementId(newElement.id);
            addToHistory([...elements, newElement]);
          }
        } else if (e.key === 'd') {
          // Duplicate
          e.preventDefault();
          const duplicatedElement = handleDuplicate(selectedElement);
          if (duplicatedElement) {
            setElements(prev => [...prev, duplicatedElement]);
            setSelectedElementId(duplicatedElement.id);
            addToHistory([...elements, duplicatedElement]);
          }
        }
      }
      
      // Handle Delete/Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        setElements(prev => prev.filter(el => el.id !== selectedElementId));
        setSelectedElementId(null);
        toast.success('Element deleted');
        addToHistory(elements.filter(el => el.id !== selectedElementId));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [elements, selectedElement, selectedElementId, handleCopy, handlePaste, handleDuplicate, addToHistory]);
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-secondary/20">
      {/* Zoom controls */}
      <ZoomControls 
        scale={scale} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
      />
      
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
          {/* Render workspace elements with connections */}
          <CanvasElements 
            elements={elements}
            connections={connections}
            isCreatingConnection={isCreatingConnection}
            activeConnection={activeConnection}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
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
