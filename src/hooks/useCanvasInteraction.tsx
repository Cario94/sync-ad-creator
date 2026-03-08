import { useState, useRef, useEffect, useCallback } from 'react';
import type { CanvasElement } from '@/components/workspace/types/canvas';

export interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface UseCanvasInteractionOptions {
  minScale?: number;
  maxScale?: number;
}

/** Convert screen (client) coordinates to world (canvas) coordinates */
export function screenToWorld(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: Viewport,
): { x: number; y: number } {
  return {
    x: (clientX - containerRect.left - viewport.x) / viewport.zoom,
    y: (clientY - containerRect.top - viewport.y) / viewport.zoom,
  };
}

export const useCanvasInteraction = (options: UseCanvasInteractionOptions = {}) => {
  const { minScale = 0.25, maxScale = 3 } = options;

  /** Ref to the OUTER container div (un-transformed, captures mouse events) */
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [clipboardItem, setClipboardItem] = useState<CanvasElement[] | null>(null);

  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Refs for stable access in handlers
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const spacePressedRef = useRef(spacePressed);
  spacePressedRef.current = spacePressed;
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const isSelectingRef = useRef(isSelecting);
  isSelectingRef.current = isSelecting;
  const selectionStartRef = useRef({ x: 0, y: 0 });

  // Panning state (kept in refs for perf)
  const panStartRef = useRef({ mx: 0, my: 0, vx: 0, vy: 0 });

  // ── Zoom ──

  const clampZoom = useCallback((z: number) => Math.min(Math.max(z, minScale), maxScale), [minScale, maxScale]);

  const handleZoomIn = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: clampZoom(prev.zoom * 1.15) }));
  }, [clampZoom]);

  const handleZoomOut = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: clampZoom(prev.zoom / 1.15) }));
  }, [clampZoom]);

  // ── Mouse handlers (on OUTER container) ──

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Space+click = pan
    if (spacePressedRef.current) {
      e.preventDefault();
      setIsDragging(true);
      panStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        vx: viewportRef.current.x,
        vy: viewportRef.current.y,
      };
      return;
    }

    // Middle mouse = pan
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      panStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        vx: viewportRef.current.x,
        vy: viewportRef.current.y,
      };
      return;
    }

    // Click on empty canvas = start selection rectangle
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.canvasBackground === 'true') {
      const rect = container.getBoundingClientRect();
      const world = screenToWorld(e.clientX, e.clientY, rect, viewportRef.current);
      selectionStartRef.current = world;
      setSelectionRect({ startX: world.x, startY: world.y, width: 0, height: 0 });
      setIsSelecting(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Pan
    if (isDraggingRef.current && (spacePressedRef.current || e.buttons === 4)) {
      const ps = panStartRef.current;
      setViewport(prev => ({
        ...prev,
        x: ps.vx + (e.clientX - ps.mx),
        y: ps.vy + (e.clientY - ps.my),
      }));
      return;
    }

    // Selection
    if (isSelectingRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const world = screenToWorld(e.clientX, e.clientY, rect, viewportRef.current);
      const start = selectionStartRef.current;
      setSelectionRect({
        startX: Math.min(start.x, world.x),
        startY: Math.min(start.y, world.y),
        width: Math.abs(world.x - start.x),
        height: Math.abs(world.y - start.y),
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (isSelectingRef.current) setIsSelecting(false);
  }, []);

  // ── Wheel: Ctrl/Cmd = zoom toward cursor, otherwise = pan ──

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => {
      // Ctrl/Cmd+wheel = zoom toward cursor
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const vp = viewportRef.current;
        const delta = -e.deltaY * 0.005;
        const newZoom = Math.min(Math.max(vp.zoom * (1 + delta), minScale), maxScale);
        const ratio = newZoom / vp.zoom;

        // Anchor zoom at cursor position
        setViewport({
          x: cursorX - ratio * (cursorX - vp.x),
          y: cursorY - ratio * (cursorY - vp.y),
          zoom: newZoom,
        });
        return;
      }

      // Two-finger trackpad or scroll = pan
      e.preventDefault();
      setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => container.removeEventListener('wheel', wheelHandler);
  }, [minScale, maxScale]);

  // ── Space key for pan mode ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsDragging(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Copy/Paste/Duplicate ──

  const cloneElement = (el: CanvasElement, offsetX = 20, offsetY = 20): CanvasElement => ({
    ...el,
    id: `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: `${el.name} (copy)`,
    position: { x: el.position.x + offsetX, y: el.position.y + offsetY },
    config: el.config ? JSON.parse(JSON.stringify(el.config)) : {},
  });

  const handleCopy = useCallback((selectedElements: CanvasElement[]) => {
    if (selectedElements.length > 0) setClipboardItem(selectedElements);
  }, []);

  const handlePaste = useCallback((): CanvasElement[] | null => {
    if (clipboardItem && clipboardItem.length > 0) {
      return clipboardItem.map(item => cloneElement(item));
    }
    return null;
  }, [clipboardItem]);

  const handleDuplicate = useCallback((selectedElements: CanvasElement[]): CanvasElement[] | null => {
    if (selectedElements.length > 0) {
      return selectedElements.map(item => cloneElement(item));
    }
    return null;
  }, []);

  // Expose convenient setters
  const setScale = useCallback((z: number | ((prev: number) => number)) => {
    setViewport(prev => ({
      ...prev,
      zoom: typeof z === 'function' ? z(prev.zoom) : z,
    }));
  }, []);

  const setPan = useCallback((p: { x: number; y: number }) => {
    setViewport(prev => ({ ...prev, x: p.x, y: p.y }));
  }, []);

  return {
    containerRef,
    viewport,
    setViewport,
    scale: viewport.zoom,
    pan: { x: viewport.x, y: viewport.y },
    isDragging,
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
  };
};
