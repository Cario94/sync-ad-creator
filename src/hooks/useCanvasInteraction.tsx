
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseCanvasInteractionOptions {
  minScale?: number;
  maxScale?: number;
}

export interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
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
  
  // Selection rectangle state
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  
  // Handle zoom with buttons
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, maxScale));
  }, [maxScale]);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, minScale));
  }, [minScale]);
  
  // Handle canvas dragging (panning) with space + mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If space is pressed, handle canvas dragging
    if (spacePressed) {
      setIsDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    // If we're not panning and the click is directly on the canvas background
    // (not a child element), start selection
    if (e.target === e.currentTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / scale - pan.x;
        const y = (e.clientY - rect.top) / scale - pan.y;
        setSelectionStart({ x, y });
        setSelectionRect({ startX: x, startY: y, width: 0, height: 0 });
        setIsSelecting(true);
      }
    }
  }, [spacePressed, pan, scale]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle canvas dragging
    if (isDragging && spacePressed) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }
    
    // Handle selection rectangle
    if (isSelecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / scale - pan.x;
      const currentY = (e.clientY - rect.top) / scale - pan.y;
      
      setSelectionRect({
        startX: Math.min(selectionStart.x, currentX),
        startY: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y)
      });
    }
  }, [isDragging, spacePressed, startPan, isSelecting, selectionStart, scale, pan]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
    
    // Finish selection operation
    if (isSelecting) {
      setIsSelecting(false);
      // The actual selection logic will be handled in the component that uses this hook
    }
  }, [isSelecting]);

  // Handle clipboard operations
  const handleCopy = useCallback((selectedElements: any[]) => {
    if (selectedElements.length > 0) {
      setClipboardItem(selectedElements);
      toast.success(`Copied ${selectedElements.length} element(s) to clipboard`);
    }
  }, []);

  const handlePaste = useCallback(() => {
    if (clipboardItem) {
      // Return the clipboard items with new IDs and slightly offset positions
      const newItems = Array.isArray(clipboardItem) 
        ? clipboardItem.map(item => ({
            ...item,
            id: `${item.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            position: {
              x: item.position.x + 20,
              y: item.position.y + 20
            }
          }))
        : [{
            ...clipboardItem,
            id: `${clipboardItem.type}-${Date.now()}`,
            position: {
              x: clipboardItem.position.x + 20,
              y: clipboardItem.position.y + 20
            }
          }];
      
      toast.success(`Pasted ${newItems.length} element(s) from clipboard`);
      return newItems;
    }
    return null;
  }, [clipboardItem]);

  const handleDuplicate = useCallback((selectedElements: any[]) => {
    if (selectedElements.length > 0) {
      // Create duplicates with new IDs and slightly offset positions
      const duplicatedItems = selectedElements.map(item => ({
        ...item,
        id: `${item.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        position: {
          x: item.position.x + 20,
          y: item.position.y + 20
        }
      }));
      
      toast.success(`Duplicated ${duplicatedItems.length} element(s)`);
      return duplicatedItems;
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
  };
};
