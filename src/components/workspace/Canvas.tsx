
import React, { useState, useEffect } from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements from './CanvasElements';
import { CanvasElement } from './types/canvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useConnections } from '@/hooks/useConnections';
import { toast } from 'sonner';
import MultiSelectSettings from './MultiSelectSettings';

interface CanvasProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onTidyLayout?: () => void;
}

// Expose Canvas methods via ref
interface CanvasRef {
  tidyLayout: () => void;
}

const Canvas = React.forwardRef<CanvasRef, CanvasProps>(({ className = '', onUndo, onRedo, onTidyLayout }, ref) => {
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
        // Use actual element dimensions - all elements use w-64 (256px) and approximate height
        const elementWidth = 256; // w-64 class = 256px
        const elementHeight = 120; // Approximate height including padding and content
        
        // Element boundaries
        const elementLeft = x;
        const elementRight = x + elementWidth;
        const elementTop = y;
        const elementBottom = y + elementHeight;
        
        // Selection boundaries
        const selectionLeft = selectionRect.startX;
        const selectionRight = selectionRect.startX + selectionRect.width;
        const selectionTop = selectionRect.startY;
        const selectionBottom = selectionRect.startY + selectionRect.height;
        
        // Check for overlap (not just if top-left corner is inside)
        const isOverlapping = !(
          elementRight < selectionLeft ||
          elementLeft > selectionRight ||
          elementBottom < selectionTop ||
          elementTop > selectionBottom
        );
        
        return isOverlapping;
      }).map(el => el.id);
      
      if (selectedIds.length > 0) {
        setSelectedElementIds(selectedIds);
        if (selectedIds.length > 1) {
          setShowMultiSettings(true);
        }
        toast.success(`Selected ${selectedIds.length} element${selectedIds.length > 1 ? 's' : ''}`);
      } else {
        // Clear selection if no elements found
        setSelectedElementIds([]);
        setShowMultiSettings(false);
      }
    }
    // Clear selection rectangle after processing, regardless of results
    if (!isSelecting && selectionRect) {
      // Small delay to ensure visual feedback is seen
      const timer = setTimeout(() => {
        // This helps ensure the selection rectangle is properly cleared
      }, 50);
      return () => clearTimeout(timer);
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

  // Handle updating individual element (for alignment)
  const updateIndividualElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => 
      prev.map(el => 
        el.id === elementId 
          ? { ...el, ...updates } 
          : el
      )
    );
    addToHistory(elements);
  };

  // Tidy layout function - organizes elements in a clean grid
  const tidyLayout = () => {
    // Group elements by type
    const campaigns = elements.filter(el => el.type === 'campaign');
    const adsets = elements.filter(el => el.type === 'adset');
    const ads = elements.filter(el => el.type === 'ad');
    
    const startX = 100;
    const startY = 100;
    const horizontalSpacing = 350;
    const verticalSpacing = 150;
    
    const newElements = [...elements];
    
    // Position campaigns in first column
    campaigns.forEach((campaign, index) => {
      const element = newElements.find(el => el.id === campaign.id);
      if (element) {
        element.position = {
          x: startX,
          y: startY + (index * verticalSpacing)
        };
      }
    });
    
    // Position adsets in second column
    adsets.forEach((adset, index) => {
      const element = newElements.find(el => el.id === adset.id);
      if (element) {
        element.position = {
          x: startX + horizontalSpacing,
          y: startY + (index * verticalSpacing)
        };
      }
    });
    
    // Position ads in third column
    ads.forEach((ad, index) => {
      const element = newElements.find(el => el.id === ad.id);
      if (element) {
        element.position = {
          x: startX + (horizontalSpacing * 2),
          y: startY + (index * verticalSpacing)
        };
      }
    });
    
    setElements(newElements);
    addToHistory(newElements);
    onTidyLayout?.();
    toast.success('Layout organized successfully');
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    tidyLayout
  }));
  
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
        } else if (e.key === 'z') {
          // Undo/Redo
          e.preventDefault();
          if (e.shiftKey) {
            const state = handleRedo();
            if (state) {
              setElements(state);
              onRedo?.();
            }
          } else {
            const state = handleUndo();
            if (state) {
              setElements(state);
              onUndo?.();
            }
          }
        }
      }
      
      // Handle Delete/Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        
        const newElements = elements.filter(el => !selectedElementIds.includes(el.id));
        
        // Remove the selected elements
        setElements(newElements);
        
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
        toast.success(`Deleted ${selectedElementIds.length} element(s)`);
        addToHistory(newElements);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [elements, selectedElements, selectedElementIds, handleCopy, handlePaste, handleDuplicate, handleUndo, handleRedo, addToHistory, connections, removeConnection, onUndo, onRedo]);
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
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
            transition: isDragging || isSelecting ? 'none' : 'transform 0.1s'
          }}
        >
          {/* SVG Grid Background */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ 
              zIndex: 0,
              minWidth: '200%',
              minHeight: '200%',
              left: '-50%',
              top: '-50%'
            }}
          >
            <defs>
              <pattern 
                id="grid" 
                width="25" 
                height="25" 
                patternUnits="userSpaceOnUse"
              >
                <path 
                  d="M 25 0 L 0 0 0 25" 
                  fill="none" 
                  stroke="rgba(0, 0, 0, 0.05)" 
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
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
});

Canvas.displayName = 'Canvas';

export default Canvas;
export type { CanvasRef };
