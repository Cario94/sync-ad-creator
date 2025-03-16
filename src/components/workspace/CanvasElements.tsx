
import React, { useEffect, useRef, useState } from 'react';
import { Connection } from '@/hooks/useConnections';
import ConnectionsRenderer from './ConnectionsRenderer';
import ElementsRenderer from './ElementsRenderer';
import { CanvasElement, ElementPosition } from './types/canvas';

interface CanvasElementsProps {
  elements: CanvasElement[];
  connections: Connection[];
  isCreatingConnection: boolean;
  activeConnection: { sourceId: string; sourceType: 'campaign' | 'adset' | 'ad' } | null;
  selectedElementIds: string[];
  onSelectElement: (id: string) => void;
  onStartConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onCompleteConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onCancelConnection: () => void;
  onRemoveConnection: (id: string) => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
}

const CanvasElements: React.FC<CanvasElementsProps> = ({ 
  elements,
  connections,
  isCreatingConnection,
  activeConnection,
  selectedElementIds,
  onSelectElement,
  onStartConnection,
  onCompleteConnection,
  onCancelConnection,
  onRemoveConnection,
  onUpdatePosition
}) => {
  const [elementPositions, setElementPositions] = useState<ElementPosition[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const svgRef = useRef<SVGSVGElement>(null);

  // Handle mouse movement for dynamic connection creation
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

  // Track element positions for drawing connections
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

  // Handle element references
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
        <ConnectionsRenderer 
          connections={connections}
          elementPositions={elementPositions}
          isCreatingConnection={isCreatingConnection}
          activeConnection={activeConnection}
          mousePosition={mousePosition}
          onRemoveConnection={onRemoveConnection}
        />
      </svg>
      
      <ElementsRenderer 
        elements={elements}
        selectedElementIds={selectedElementIds}
        isCreatingConnection={isCreatingConnection}
        activeConnection={activeConnection}
        onSelectElement={onSelectElement}
        onStartConnection={onStartConnection}
        onCompleteConnection={onCompleteConnection}
        onUpdatePosition={onUpdatePosition}
        elementRefs={handleElementRef}
      />
    </>
  );
};

export default CanvasElements;
