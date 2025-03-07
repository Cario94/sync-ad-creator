
import React from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Image } from 'lucide-react';

interface AdProps {
  name: string;
  initialPosition?: { x: number; y: number };
}

const Ad: React.FC<AdProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 } 
}) => {
  const { position, isDragging, dragRef, handleMouseDown } = useDragAndDrop({
    initialPosition
  });

  return (
    <div
      ref={dragRef}
      className={`absolute p-4 w-64 rounded-lg glass-dark shadow-sm border border-muted-foreground/30 cursor-grab ${
        isDragging ? 'cursor-grabbing shadow-md opacity-90 z-50' : 'z-10'
      } transition-shadow duration-200`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
          <Image className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-medium text-sm">Ad</div>
      </div>
      <h3 className="font-semibold text-base">{name}</h3>
      <div className="mt-2 text-xs text-muted-foreground">
        Format: Image • Status: Active
      </div>
    </div>
  );
};

export default Ad;
