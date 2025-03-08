
import { useState, useRef, useEffect } from 'react';

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
  dragRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
}

const useDragAndDrop = ({ initialPosition = { x: 0, y: 0 } }: UseDragAndDropProps = {}): UseDragAndDropResult => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [elementOffset, setElementOffset] = useState<Position>({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      setElementOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setStartPos({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      const parent = dragRef.current.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        
        // Calculate the new position relative to the parent
        const newX = e.clientX - parentRect.left - elementOffset.x;
        const newY = e.clientY - parentRect.top - elementOffset.y;
        
        // Ensure the element stays within the parent bounds
        const maxX = parentRect.width - dragRef.current.offsetWidth;
        const maxY = parentRect.height - dragRef.current.offsetHeight;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
  }, [isDragging]);

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown
  };
};

export default useDragAndDrop;
