import React from 'react';
import { Connection } from '@/hooks/useConnections';
import ConnectionsRenderer from './ConnectionsRenderer';
import ElementsRenderer from './ElementsRenderer';
import { CanvasElement } from './types/canvas';
import type { Viewport } from '@/hooks/useCanvasInteraction';

// Known node sizes in world coordinates
const NODE_SIZES: Record<string, { w: number; h: number }> = {
  campaign: { w: 288, h: 140 },
  adset: { w: 264, h: 130 },
  ad: { w: 240, h: 120 },
};

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
  viewport: Viewport;
  containerRef: React.RefObject<HTMLDivElement>;
  snapSize: number;
  worldMousePos: { x: number; y: number };
  onDragEnd: () => void;
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
  viewport,
  containerRef,
  snapSize,
  worldMousePos,
  onDragEnd,
}) => {
  // Derive element positions from model data (no DOM measurement!)
  const elementPositions = elements.map(el => {
    const size = NODE_SIZES[el.type] || { w: 256, h: 120 };
    return {
      id: el.id,
      x: el.position.x,
      y: el.position.y,
      width: size.w,
      height: size.h,
    };
  });

  // Cancel in-progress connection on mouseup in empty space
  React.useEffect(() => {
    if (!isCreatingConnection) return;
    const handleMouseUp = () => { onCancelConnection(); };
    // We use capture so this fires even if the event is on the canvas background
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mouseup', handleMouseUp); };
  }, [isCreatingConnection, onCancelConnection]);

  return (
    <>
      {/* SVG layer for connections – positioned in world coordinates */}
      <svg
        className="absolute top-0 left-0 pointer-events-none z-0"
        style={{ overflow: 'visible', width: '100%', height: '100%' }}
      >
        <ConnectionsRenderer
          connections={connections}
          elementPositions={elementPositions}
          isCreatingConnection={isCreatingConnection}
          activeConnection={activeConnection}
          mousePosition={worldMousePos}
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
        elementRefs={() => {}} // No longer needed for DOM measurement
        viewport={viewport}
        containerRef={containerRef}
        snapSize={snapSize}
        onDragEnd={onDragEnd}
      />
    </>
  );
};

export default CanvasElements;
