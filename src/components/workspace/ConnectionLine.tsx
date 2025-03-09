
import React, { useRef, useState } from 'react';
import { Connection } from '@/hooks/useConnections';
import { X } from 'lucide-react';

interface ElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConnectionLineProps {
  connection: Connection;
  elementPositions: ElementPosition[];
  onRemove: (id: string) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  connection, 
  elementPositions,
  onRemove
}) => {
  const [hover, setHover] = useState(false);
  
  const sourceElement = elementPositions.find(el => el.id === connection.sourceId);
  const targetElement = elementPositions.find(el => el.id === connection.targetId);
  
  if (!sourceElement || !targetElement) return null;
  
  const sourceX = sourceElement.x + sourceElement.width;
  const sourceY = sourceElement.y + sourceElement.height / 2;
  
  const targetX = targetElement.x;
  const targetY = targetElement.y + targetElement.height / 2;
  
  // Calculate control points for the curved line
  const midX = (sourceX + targetX) / 2;
  
  // Create the path for the curved line
  const pathData = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
  
  // Calculate point for delete button (near the midpoint of the curve)
  const deleteButtonX = midX;
  const deleteButtonY = (sourceY + targetY) / 2 - 15; // Offset above the midpoint
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(connection.id);
  };
  
  return (
    <g 
      className="connection-line"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <path
        d={pathData}
        fill="none"
        stroke={hover ? "var(--primary)" : "var(--muted-foreground)"}
        strokeWidth={2}
        strokeDasharray={hover ? "none" : "5,5"}
      />
      
      {/* Arrow head at the target */}
      <polygon 
        points={`${targetX-10},${targetY-5} ${targetX},${targetY} ${targetX-10},${targetY+5}`}
        fill={hover ? "var(--primary)" : "var(--muted-foreground)"}
        stroke="none"
      />
      
      {/* Delete button (only shows on hover) */}
      {hover && (
        <g 
          transform={`translate(${deleteButtonX}, ${deleteButtonY})`}
          onClick={handleRemove}
          style={{ cursor: 'pointer' }}
        >
          <circle 
            r={12}
            fill="var(--destructive)"
            stroke="white"
            strokeWidth={1.5}
          />
          <foreignObject x={-6} y={-6} width={12} height={12}>
            <div className="h-full w-full flex items-center justify-center">
              <X size={10} className="text-white" />
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
};

export default ConnectionLine;
