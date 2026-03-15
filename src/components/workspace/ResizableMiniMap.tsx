import React from 'react';
import { MiniMap } from '@xyflow/react';

const ResizableMiniMap: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg shadow p-1">
      <MiniMap
        width={180}
        height={120}
        nodeStrokeWidth={3}
        pannable
        zoomable
        maskColor="hsl(var(--background) / 0.7)"
        className="!bg-transparent"
      />
    </div>
  );
};

export default ResizableMiniMap;
