
import { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDragAndDropProps {
  initialPosition?: Position;
  onSelect?: () => void;
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

const useDragAndDrop = ({ 
  initialPosition = { x: 0, y: 0 },
  onSelect
}: UseDragAndDropProps = {}): UseDragAndDropResult => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [elementOffset, setElementOffset] = useState<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);

  // Update position when initialPosition changes (for multi-select transforms)
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movedRef.current) {
      setIsSelected(true);
      if (onSelect) onSelect();
    }
    movedRef.current = false;
  }, [onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Only left mouse button
    
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setElementOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setStartPos({ x: e.clientX, y: e.clientY });
      
      // Immediate start to dragging
      movedRef.current = false;
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !nodeRef.current) return;
    
    movedRef.current = true;
    
    const parent = nodeRef.current.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      
      // Calculate the new position relative to the parent
      const newX = e.clientX - parentRect.left - elementOffset.x;
      const newY = e.clientY - parentRect.top - elementOffset.y;
      
      // Ensure the element stays within the parent bounds
      const maxX = parentRect.width - nodeRef.current.offsetWidth;
      const maxY = parentRect.height - nodeRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDragging, elementOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up ref callback
  const dragRef = useCallback((node: HTMLDivElement | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      handleMouseUp();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    position,
    isDragging,
    isSelected,
    setIsSelected,
    dragRef,
    handleMouseDown,
    handleClick
  };
};

export default useDragAndDrop;
