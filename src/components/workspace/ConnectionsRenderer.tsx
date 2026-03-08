import React from 'react';
import ConnectionLine, { buildEdgePath } from './ConnectionLine';
import { Connection } from '@/hooks/useConnections';

interface ElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConnectionsRendererProps {
  connections: Connection[];
  elementPositions: ElementPosition[];
  isCreatingConnection: boolean;
  activeConnection: { sourceId: string; sourceType: 'campaign' | 'adset' | 'ad' } | null;
  mousePosition: { x: number; y: number };
  onRemoveConnection: (id: string) => void;
}

const ConnectionsRenderer: React.FC<ConnectionsRendererProps> = ({
  connections,
  elementPositions,
  isCreatingConnection,
  activeConnection,
  mousePosition,
  onRemoveConnection,
}) => {
  // Preview connection anchor
  let previewPath: string | null = null;
  if (isCreatingConnection && activeConnection) {
    const sourceEl = elementPositions.find(el => el.id === activeConnection.sourceId);
    if (sourceEl) {
      const sx = sourceEl.x + sourceEl.width;
      const sy = sourceEl.y + sourceEl.height / 2;
      previewPath = buildEdgePath(sx, sy, mousePosition.x, mousePosition.y);
    }
  }

  return (
    <>
      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          elementPositions={elementPositions}
          onRemove={onRemoveConnection}
        />
      ))}

      {previewPath && (
        <>
          <path
            d={previewPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
          {/* Animated dot at the mouse end for visual feedback */}
          <circle
            cx={mousePosition.x}
            cy={mousePosition.y}
            r={5}
            fill="hsl(var(--primary))"
            opacity={0.7}
            style={{ pointerEvents: 'none' }}
          >
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </>
  );
};

export default ConnectionsRenderer;
