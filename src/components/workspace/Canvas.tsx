
import React, { useState, useRef, useEffect } from 'react';
import Campaign from './Campaign';
import AdSet from './AdSet';
import Ad from './Ad';
import { toast } from 'sonner';
import CanvasContextMenu from './CanvasContextMenu';

interface CanvasProps {
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  
  // Demo data - in a real app, this would come from state/context
  const elements = [
    { id: 'campaign-1', type: 'campaign', name: 'Summer Sale 2023', position: { x: 100, y: 100 } },
    { id: 'adset-1', type: 'adset', name: 'Women 25-34', position: { x: 400, y: 200 } },
    { id: 'ad-1', type: 'ad', name: 'Product Showcase', position: { x: 700, y: 300 } },
  ];
  
  // Handle zoom with buttons
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle zoom with trackpad/mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    // Check if Ctrl key is pressed for zooming
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(scale + delta, 0.5), 2);
      setScale(newScale);
    } else if (spacePressed) {
      // If space is pressed, pan instead of normal scroll
      e.preventDefault();
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };
  
  // Handle canvas dragging (panning) with space + mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (spacePressed) {
      setIsDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && spacePressed) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for panning
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
        // Change cursor to grabbing
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
      
      // Undo/Redo (Cmd/Ctrl + Z, Cmd/Ctrl + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          toast('Redo operation', {
            description: 'This functionality will be available in the full version'
          });
        } else {
          // Undo
          toast('Undo operation', {
            description: 'This functionality will be available in the full version'
          });
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        // Reset cursor
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Fixed: Use a non-passive wheel event listener for the canvas element
  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || spacePressed) {
        e.preventDefault();
        
        if (e.ctrlKey || e.metaKey) {
          const delta = e.deltaY * -0.01;
          const newScale = Math.min(Math.max(scale + delta, 0.5), 2);
          setScale(newScale);
        } else if (spacePressed) {
          setPan(prev => ({
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY
          }));
        }
      }
    };
    
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [scale, spacePressed, pan]);
  
  // Removed the old global wheel event handler
  // We now handle wheel events specifically on the canvas element
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-secondary/20">
      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center space-x-2 glass-morphism rounded-lg p-1">
        <button 
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary"
          aria-label="Zoom out"
        >
          -
        </button>
        <div className="text-sm font-medium">
          {Math.round(scale * 100)}%
        </div>
        <button 
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      
      <CanvasContextMenu elementType="">
        <div 
          ref={canvasRef}
          className={`workspace-canvas w-full h-full ${className} ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isDragging && spacePressed ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s'
          }}
        >
          {/* Render workspace elements */}
          {elements.map(element => {
            if (element.type === 'campaign') {
              return (
                <Campaign 
                  key={element.id}
                  id={element.id}
                  name={element.name}
                  initialPosition={element.position}
                />
              );
            } else if (element.type === 'adset') {
              return (
                <AdSet 
                  key={element.id}
                  id={element.id}
                  name={element.name}
                  initialPosition={element.position}
                />
              );
            } else if (element.type === 'ad') {
              return (
                <Ad 
                  key={element.id}
                  id={element.id}
                  name={element.name}
                  initialPosition={element.position}
                />
              );
            }
            return null;
          })}
        </div>
      </CanvasContextMenu>
    </div>
  );
};

export default Canvas;
