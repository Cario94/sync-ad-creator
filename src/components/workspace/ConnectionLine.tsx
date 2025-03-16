
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
  
  // Calculate start and end points with improved positioning
  const sourceX = sourceElement.x + sourceElement.width;
  const sourceY = sourceElement.y + sourceElement.height / 2;
  
  const targetX = targetElement.x;
  const targetY = targetElement.y + targetElement.height / 2;
  
  // Adjust control points for a smoother curve
  const dx = Math.abs(targetX - sourceX);
  const controlOffsetX = Math.min(dx * 0.5, 150);
  
  // Create the path for the curved line with better curvature
  const pathData = `M ${sourceX} ${sourceY} 
                    C ${sourceX + controlOffsetX} ${sourceY}, 
                      ${targetX - controlOffsetX} ${targetY}, 
                      ${targetX} ${targetY}`;
  
  // Calculate midpoint for delete button
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2 - 15;
  
  // Calculate points for arrow tail at the source
  const tailLength = 10;
  const tailPoints = `${sourceX},${sourceY} ${sourceX-tailLength},${sourceY-6} ${sourceX-5},${sourceY} ${sourceX-tailLength},${sourceY+6}`;
  
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
      {/* Base connection path */}
      <path
        d={pathData}
        fill="none"
        stroke={hover ? "var(--primary)" : "var(--muted-foreground)"}
        strokeWidth={2}
        strokeDasharray={hover ? "none" : "5,5"}
      />
      
      {/* Arrow tail at the source */}
      <polygon 
        points={tailPoints}
        fill={hover ? "var(--primary)" : "var(--muted-foreground)"}
        stroke="none"
      />
      
      {/* Improved arrow head at the target */}
      <polygon 
        points={`${targetX},${targetY} ${targetX-10},${targetY-6} ${targetX-5},${targetY} ${targetX-10},${targetY+6}`}
        fill={hover ? "var(--primary)" : "var(--muted-foreground)"}
        stroke="none"
      />
      
      {/* Delete button (only shows on hover) */}
      {hover && (
        <g 
          transform={`translate(${midX}, ${midY})`}
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
