
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
  const dragTimeoutRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Select this element
    setIsSelected(true);
    if (onSelect) onSelect();
  }, [onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setElementOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setStartPos({ x: e.clientX, y: e.clientY });
      
      // Set a timeout to determine if it's a drag operation
      movedRef.current = false;
      dragTimeoutRef.current = window.setTimeout(() => {
        setIsDragging(true);
      }, 150); // Small delay to differentiate click from drag
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // If the mouse has moved more than a few pixels, consider it a drag operation
    if (dragTimeoutRef.current && 
        (Math.abs(e.clientX - startPos.x) > 5 || Math.abs(e.clientY - startPos.y) > 5)) {
      movedRef.current = true;
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
      setIsDragging(true);
    }
    
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
  }, [isDragging, elementOffset, startPos.x, startPos.y]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Clear any pending drag timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    
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
      // Clean up event listeners and timeouts
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
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
