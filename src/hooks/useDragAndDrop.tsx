
import { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDragAndDropProps {
  initialPosition?: Position;
}

interface UseDragAndDropResult {
  position: Position;
  isDragging: boolean;
  dragRef: (node: HTMLDivElement | null) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
}

const useDragAndDrop = ({ initialPosition = { x: 0, y: 0 } }: UseDragAndDropProps = {}): UseDragAndDropResult => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [elementOffset, setElementOffset] = useState<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setElementOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setStartPos({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && nodeRef.current) {
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
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown
  };
};

export default useDragAndDrop;
