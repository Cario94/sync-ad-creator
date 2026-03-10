import React from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

const WorkspaceEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18,
    offset: 16,
  });

  return (
    <>
      <BaseEdge
        id={`${id}-halo`}
        path={edgePath}
        style={{
          stroke: 'hsl(var(--background) / 0.92)',
          strokeWidth: selected ? 7.5 : 7,
          opacity: 0.95,
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={28}
        className="workspace-edge-path"
        style={{
          stroke: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.72)',
          strokeWidth: selected ? 2.6 : 2.15,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          transition: 'stroke 150ms ease, stroke-width 150ms ease',
        }}
      />
    </>
  );
};

export default WorkspaceEdge;
