
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
  onEditElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  getCampaigns: () => { id: string; name: string }[];
  getAdSets: () => { id: string; name: string }[];
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
  onUpdatePosition,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  getCampaigns,
  getAdSets,
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
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseUp = () => { onCancelConnection(); };

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

    let rafId: number;
    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateElementPositions);
    };

    scheduleUpdate();
    
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    elementsRef.current.forEach(element => {
      if (element) resizeObserver.observe(element);
    });
    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }
    
    return () => {
      cancelAnimationFrame(rafId);
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
        onEditElement={onEditElement}
        onDeleteElement={onDeleteElement}
        onDuplicateElement={onDuplicateElement}
        getCampaigns={getCampaigns}
        getAdSets={getAdSets}
        elementRefs={handleElementRef}
      />
    </>
  );
};

export default CanvasElements;
