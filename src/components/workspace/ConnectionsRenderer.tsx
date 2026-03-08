import React from 'react';
import ConnectionLine from './ConnectionLine';
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

      {isCreatingConnection && activeConnection && (() => {
        const sourceElement = elementPositions.find(el => el.id === activeConnection.sourceId);

        if (sourceElement) {
          const sourceX = sourceElement.x + sourceElement.width;
          const sourceY = sourceElement.y + sourceElement.height / 2;
          const midX = (sourceX + mousePosition.x) / 2;
          const pathData = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${mousePosition.y}, ${mousePosition.x} ${mousePosition.y}`;

          return (
            <path
              d={pathData}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5,5"
              fill="none"
              style={{ vectorEffect: 'non-scaling-stroke' }}
            />
          );
        }

        return null;
      })()}
    </>
  );
};

export default ConnectionsRenderer;
