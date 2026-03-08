import { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDragAndDropProps {
  initialPosition?: Position;
  onSelect?: () => void;
  /** Current canvas viewport – needed to convert screen→world during drag */
  viewport?: { x: number; y: number; zoom: number };
  /** Ref to the outer (un-transformed) container for coordinate conversion */
  containerRef?: React.RefObject<HTMLDivElement>;
  /** Grid snap size (0 = no snap) */
  snapSize?: number;
  /** Called during drag with proposed position; return adjusted position (for alignment guides) */
  onDragMove?: (id: string, pos: Position) => Position;
  /** Node id for alignment callbacks */
  nodeId?: string;
  /** Called when drag ends */
  onDragEnd?: () => void;
}

interface UseDragAndDropResult {
  position: Position;
  isDragging: boolean;
  isSelected: boolean;
  setIsSelected: (selected: boolean) => void;
  dragRef: (node: HTMLDivElement | null) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
}

const DRAG_THRESHOLD = 3; // px in screen space before we consider it a drag

const snapToGrid = (value: number, gridSize: number): number =>
  gridSize > 0 ? Math.round(value / gridSize) * gridSize : value;

const useDragAndDrop = ({
  initialPosition = { x: 0, y: 0 },
  onSelect,
  viewport = { x: 0, y: 0, zoom: 1 },
  containerRef,
  snapSize = 0,
  onDragMove,
  nodeId = '',
  onDragEnd,
}: UseDragAndDropProps = {}): UseDragAndDropResult => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);
  const dragDataRef = useRef({
    startScreenX: 0,
    startScreenY: 0,
    startWorldX: 0,
    startWorldY: 0,
    started: false,
  });
  // Keep latest viewport in a ref so mousemove doesn't go stale
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Sync position when initialPosition changes externally (load, undo, tidy)
  const prevInitial = useRef(initialPosition);
  useEffect(() => {
    if (
      prevInitial.current.x !== initialPosition.x ||
      prevInitial.current.y !== initialPosition.y
    ) {
      prevInitial.current = initialPosition;
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!movedRef.current) {
        setIsSelected(true);
        onSelect?.();
      }
      movedRef.current = false;
    },
    [onSelect],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      movedRef.current = false;
      dragDataRef.current = {
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        startWorldX: position.x,
        startWorldY: position.y,
        started: false,
      };
      setIsDragging(true);
    },
    [position],
  );

  // Global mousemove/mouseup while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dd = dragDataRef.current;
      const vp = viewportRef.current;

      // Check threshold
      if (!dd.started) {
        const dx = Math.abs(e.clientX - dd.startScreenX);
        const dy = Math.abs(e.clientY - dd.startScreenY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        dd.started = true;
      }

      movedRef.current = true;

      // Convert screen delta to world delta (divide by zoom)
      const deltaScreenX = e.clientX - dd.startScreenX;
      const deltaScreenY = e.clientY - dd.startScreenY;
      let newX = dd.startWorldX + deltaScreenX / vp.zoom;
      let newY = dd.startWorldY + deltaScreenY / vp.zoom;

      // Snap
      newX = snapToGrid(newX, snapSize);
      newY = snapToGrid(newY, snapSize);

      let pos = { x: newX, y: newY };

      // Allow alignment callback to adjust
      if (onDragMove) {
        pos = onDragMove(nodeId, pos);
      }

      setPosition(pos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, snapSize, onDragMove, nodeId, onDragEnd]);

  const dragRef = useCallback((node: HTMLDivElement | null) => {
    nodeRef.current = node;
  }, []);

  return {
    position,
    isDragging,
    isSelected,
    setIsSelected,
    dragRef,
    handleMouseDown,
    handleClick,
  };
};

export default useDragAndDrop;
