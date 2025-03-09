
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useConnections } from './useConnections';

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
  const [clipboardItem, setClipboardItem] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Handle zoom with buttons
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, maxScale));
  }, [maxScale]);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, minScale));
  }, [minScale]);
  
  // Handle canvas dragging (panning) with space + mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (spacePressed) {
      setIsDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [spacePressed, pan]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && spacePressed) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  }, [isDragging, spacePressed, startPan]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle clipboard operations
  const handleCopy = useCallback((selectedElement: any) => {
    if (selectedElement) {
      setClipboardItem(selectedElement);
      toast.success('Copied to clipboard');
    }
  }, []);

  const handlePaste = useCallback(() => {
    if (clipboardItem) {
      // Return the clipboard item with a new ID and slightly offset position
      const newItem = {
        ...clipboardItem,
        id: `${clipboardItem.type}-${Date.now()}`,
        position: {
          x: clipboardItem.position.x + 20,
          y: clipboardItem.position.y + 20
        }
      };
      toast.success('Pasted from clipboard');
      return newItem;
    }
    return null;
  }, [clipboardItem]);

  const handleDuplicate = useCallback((selectedElement: any) => {
    if (selectedElement) {
      // Create a duplicate with a new ID and slightly offset position
      const duplicatedItem = {
        ...selectedElement,
        id: `${selectedElement.type}-${Date.now()}`,
        position: {
          x: selectedElement.position.x + 20,
          y: selectedElement.position.y + 20
        }
      };
      toast.success('Duplicated element');
      return duplicatedItem;
    }
    return null;
  }, []);

  // Undo/Redo operations
  const addToHistory = useCallback((state: any) => {
    setHistory(prev => {
      // Remove any forward history if we're adding a new state after undoing
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, state];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      toast.info('Undo operation');
      return history[historyIndex - 1];
    }
    toast.info('Nothing to undo');
    return null;
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      toast.info('Redo operation');
      return history[historyIndex + 1];
    }
    toast.info('Nothing to redo');
    return null;
  }, [history, historyIndex]);
  
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
      
      // Handle keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'c') {
          // Copy functionality is handled externally
          e.preventDefault();
        } else if (e.key === 'v') {
          // Paste functionality is handled externally
          e.preventDefault();
        } else if (e.key === 'd') {
          // Duplicate functionality is handled externally
          e.preventDefault();
        } else if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            // Redo
            handleRedo();
          } else {
            // Undo
            handleUndo();
          }
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
  }, [handleRedo, handleUndo]);
  
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
    setPan,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleUndo,
    handleRedo,
    addToHistory
  };
};
