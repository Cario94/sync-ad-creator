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
  const containerRef = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>;

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

    // Left-click on empty canvas = start selection rectangle.
    // Node mousedown handlers call stopPropagation, so any mousedown
    // that reaches this handler is guaranteed to be on empty canvas.
    if (e.button === 0) {
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

  // Accumulate deltas and flush once per frame to avoid jitter
  const pendingDelta = useRef({ dx: 0, dy: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** Normalize deltaY across deltaMode (pixel / line / page) */
    const normalizeDelta = (delta: number, mode: number) => {
      if (mode === 1) return delta * 20;  // line → px
      if (mode === 2) return delta * 400; // page → px
      return delta; // already px (mode 0, trackpad)
    };

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      const dy = normalizeDelta(e.deltaY, e.deltaMode);
      const dx = normalizeDelta(e.deltaX, e.deltaMode);

      // ── Zoom: Ctrl/Cmd + wheel or pinch gesture ──
      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const vp = viewportRef.current;

        // Pinch gestures on trackpad send small fractional deltaY with ctrlKey.
        // Mouse wheel sends larger integers. Use a tuned multiplier and clamp.
        const raw = -dy * 0.008;
        const clamped = Math.max(-0.15, Math.min(0.15, raw)); // cap per-event change
        const newZoom = Math.min(Math.max(vp.zoom * (1 + clamped), minScale), maxScale);
        const ratio = newZoom / vp.zoom;

        // Anchor zoom at cursor
        setViewport({
          x: cursorX - ratio * (cursorX - vp.x),
          y: cursorY - ratio * (cursorY - vp.y),
          zoom: newZoom,
        });
        return;
      }

      // ── Pan: two-finger trackpad or mouse scroll ──
      // Accumulate and flush on next animation frame for smoothness
      pendingDelta.current.dx += dx;
      pendingDelta.current.dy += dy;

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          const { dx: pdx, dy: pdy } = pendingDelta.current;
          pendingDelta.current.dx = 0;
          pendingDelta.current.dy = 0;
          rafId.current = null;

          setViewport(prev => ({
            ...prev,
            x: prev.x - pdx,
            y: prev.y - pdy,
          }));
        });
      }
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      container.removeEventListener('wheel', wheelHandler);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [minScale, maxScale]);

  // ── Space key for pan mode (only when canvas is focused context, not inside inputs) ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept space in input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

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
