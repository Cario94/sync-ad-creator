import React from 'react';
import {
  getSmoothStepPath,
  type ConnectionLineComponentProps,
} from '@xyflow/react';

const WorkspaceConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}) => {
  if (typeof toX !== 'number' || typeof toY !== 'number') {
    return null;
  }

  const [connectionPath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 18,
    offset: 16,
  });

  return (
    <g className="workspace-connection-line">
      <path
        d={connectionPath}
        fill="none"
        stroke="hsl(var(--background) / 0.9)"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d={connectionPath}
        fill="none"
        stroke="hsl(var(--primary) / 0.9)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="6 5"
      />
    </g>
  );
};

export default WorkspaceConnectionLine;
