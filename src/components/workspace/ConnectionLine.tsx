
import React, { useRef, useEffect, useState } from 'react';
import { Connection } from '@/hooks/useConnections';
import { ArrowRightIcon, X } from 'lucide-react';

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
  const lineRef = useRef<SVGLineElement>(null);
  const [hover, setHover] = useState(false);
  
  const sourceElement = elementPositions.find(el => el.id === connection.sourceId);
  const targetElement = elementPositions.find(el => el.id === connection.targetId);
  
  if (!sourceElement || !targetElement) return null;
  
  const sourceX = sourceElement.x + sourceElement.width;
  const sourceY = sourceElement.y + sourceElement.height / 2;
  
  const targetX = targetElement.x;
  const targetY = targetElement.y + targetElement.height / 2;
  
  // Calculate midpoint for arrow and delete button
  const midX = sourceX + (targetX - sourceX) / 2;
  const midY = sourceY + (targetY - sourceY) / 2;
  
  // Calculate angle for the arrow rotation
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI);
  
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
      <line
        ref={lineRef}
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        stroke={hover ? "var(--primary)" : "var(--muted-foreground)"}
        strokeWidth={2}
        strokeDasharray={hover ? "none" : "5,5"}
      />
      
      {/* Arrow in the middle */}
      <g 
        transform={`translate(${midX}, ${midY}) rotate(${angle})`}
        style={{ cursor: 'pointer' }}
      >
        <circle 
          r={hover ? 14 : 12}
          fill={hover ? "var(--primary-foreground)" : "white"}
          stroke={hover ? "var(--primary)" : "var(--muted-foreground)"}
          strokeWidth={1.5}
        />
        <foreignObject 
          x={-8} 
          y={-8} 
          width={16} 
          height={16}
          style={{ pointerEvents: 'none' }}
        >
          <div className="h-full w-full flex items-center justify-center">
            <ArrowRightIcon 
              size={14} 
              className={hover ? "text-primary" : "text-muted-foreground"} 
            />
          </div>
        </foreignObject>
      </g>
      
      {/* Delete button (only shows on hover) */}
      {hover && (
        <g 
          transform={`translate(${midX}, ${midY - 25})`}
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
