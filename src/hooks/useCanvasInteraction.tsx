
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseCanvasInteractionOptions {
  minScale?: number;
  maxScale?: number;
}

export const useCanvasInteraction = (options: UseCanvasInteractionOptions = {}) => {
  const { minScale = 0.5, maxScale = 2 } = options;
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  
  // Handle zoom with buttons
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, maxScale));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, minScale));
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
  
  // Use a non-passive wheel event listener for the canvas element
  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || spacePressed) {
        e.preventDefault();
        
        if (e.ctrlKey || e.metaKey) {
          const delta = e.deltaY * -0.01;
          const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);
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
  }, [scale, spacePressed, pan, minScale, maxScale]);
  
  return {
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
    setScale,
    setPan
  };
};
