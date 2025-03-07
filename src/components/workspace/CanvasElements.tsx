import React, { useEffect, useRef, useState } from 'react';
import Campaign from './Campaign';
import AdSet from './AdSet';
import Ad from './Ad';
import ConnectionLine from './ConnectionLine';
import { Connection } from '@/hooks/useConnections';

export interface CanvasElement {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  position: { x: number; y: number };
}

interface ElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasElementsProps {
  elements: CanvasElement[];
  connections: Connection[];
  isCreatingConnection: boolean;
  activeConnection: { sourceId: string; sourceType: 'campaign' | 'adset' | 'ad' } | null;
  onStartConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onCompleteConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onCancelConnection: () => void;
  onRemoveConnection: (id: string) => void;
}

const CanvasElements: React.FC<CanvasElementsProps> = ({ 
  elements,
  connections,
  isCreatingConnection,
  activeConnection,
  onStartConnection,
  onCompleteConnection,
  onCancelConnection,
  onRemoveConnection
}) => {
  const [elementPositions, setElementPositions] = useState<ElementPosition[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isCreatingConnection || !svgRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      
      const rect = svgRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleMouseUp = () => {
      onCancelConnection();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCreatingConnection, onCancelConnection]);

  useEffect(() => {
    const updateElementPositions = () => {
      const positions: ElementPosition[] = [];
      
      elementsRef.current.forEach((element, id) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const svgRect = svgRef.current?.getBoundingClientRect();
          
          if (svgRect) {
            positions.push({
              id,
              x: rect.left - svgRect.left,
              y: rect.top - svgRect.top,
              width: rect.width,
              height: rect.height
            });
          }
        }
      });
      
      setElementPositions(positions);
    };

    updateElementPositions();
    
    const resizeObserver = new ResizeObserver(() => {
      updateElementPositions();
    });
    
    elementsRef.current.forEach(element => {
      if (element) {
        resizeObserver.observe(element);
      }
    });
    
    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [elements]);

  const handleElementRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      elementsRef.current.set(id, element);
    } else {
      elementsRef.current.delete(id);
    }
  };

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{ overflow: 'visible' }}
      >
        {connections.map(connection => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            elementPositions={elementPositions}
            onRemove={onRemoveConnection}
          />
        ))}
        
        {isCreatingConnection && activeConnection && (() => {
          const sourceElement = elementPositions.find(el => el.id === activeConnection.sourceId);
          
          if (sourceElement) {
            const sourceX = sourceElement.x + sourceElement.width;
            const sourceY = sourceElement.y + sourceElement.height / 2;
            
            return (
              <line
                x1={sourceX}
                y1={sourceY}
                x2={mousePosition.x}
                y2={mousePosition.y}
                stroke="var(--primary)"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            );
          }
          
          return null;
        })()}
      </svg>
      
      {elements.map(element => {
        const commonProps = {
          key: element.id,
          id: element.id,
          name: element.name,
          initialPosition: element.position,
          elementRef: (el: HTMLDivElement | null) => handleElementRef(element.id, el),
          isCreatingConnection,
          activeConnectionId: activeConnection?.sourceId,
          onStartConnection: () => onStartConnection(element.id, element.type),
          onCompleteConnection: () => onCompleteConnection(element.id, element.type),
        };
        
        if (element.type === 'campaign') {
          return <Campaign {...commonProps} />;
        } else if (element.type === 'adset') {
          return <AdSet {...commonProps} />;
        } else if (element.type === 'ad') {
          return <Ad {...commonProps} />;
        }
        return null;
      })}
    </>
  );
};

export default CanvasElements;
