import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CanvasElement } from '@/components/workspace/types/canvas';

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
  const [clipboardItem, setClipboardItem] = useState<CanvasElement[] | null>(null);
  
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, maxScale));
  }, [maxScale]);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, minScale));
  }, [minScale]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (spacePressed) {
      e.preventDefault();
      setIsDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    if (e.target === e.currentTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / scale;
        const y = (e.clientY - rect.top - pan.y) / scale;
        setSelectionStart({ x, y });
        setSelectionRect({ startX: x, startY: y, width: 0, height: 0 });
        setIsSelecting(true);
      }
    }
  }, [spacePressed, pan, scale]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && spacePressed) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }
    
    if (isSelecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - pan.x) / scale;
      const currentY = (e.clientY - rect.top - pan.y) / scale;
      
      setSelectionRect({
        startX: Math.min(selectionStart.x, currentX),
        startY: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y)
      });
    }
  }, [isDragging, spacePressed, startPan, isSelecting, selectionStart, scale, pan]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (isSelecting) setIsSelecting(false);
  }, [isSelecting]);

  const cloneElement = (el: CanvasElement, offsetX = 20, offsetY = 20): CanvasElement => ({
    ...el,
    id: `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: `${el.name} (copy)`,
    position: { x: el.position.x + offsetX, y: el.position.y + offsetY },
    config: el.config ? JSON.parse(JSON.stringify(el.config)) : {},
  });

  const handleCopy = useCallback((selectedElements: CanvasElement[]) => {
    if (selectedElements.length > 0) {
      setClipboardItem(selectedElements);
      toast.success(`Copied ${selectedElements.length} element(s) to clipboard`);
    }
  }, []);

  const handlePaste = useCallback((): CanvasElement[] | null => {
    if (clipboardItem && clipboardItem.length > 0) {
      const newItems = clipboardItem.map(item => cloneElement(item));
      toast.success(`Pasted ${newItems.length} element(s) from clipboard`);
      return newItems;
    }
    return null;
  }, [clipboardItem]);

  const handleDuplicate = useCallback((selectedElements: CanvasElement[]): CanvasElement[] | null => {
    if (selectedElements.length > 0) {
      const duplicated = selectedElements.map(item => cloneElement(item));
      toast.success(`Duplicated ${duplicated.length} element(s)`);
      return duplicated;
    }
    return null;
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'c' || e.key === 'v' || e.key === 'd') e.preventDefault();
        else if (e.key === 'z') e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.005;
        setScale(prev => Math.min(Math.max(prev + delta, minScale), maxScale));
        return;
      }
      if (spacePressed) {
        e.preventDefault();
        setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        return;
      }
      const isTrackpadPan = Math.abs(e.deltaX) > 0 || (Math.abs(e.deltaY) < 50 && e.deltaMode === 0);
      if (isTrackpadPan && !e.shiftKey) {
        e.preventDefault();
        setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => canvas.removeEventListener('wheel', wheelHandler);
  }, [scale, spacePressed, minScale, maxScale]);
  
  return {
    canvasRef, scale, isDragging, pan, spacePressed,
    selectionRect, isSelecting,
    handleZoomIn, handleZoomOut,
    handleMouseDown, handleMouseMove, handleMouseUp,
    setScale, setPan,
    handleCopy, handlePaste, handleDuplicate,
  };
};
