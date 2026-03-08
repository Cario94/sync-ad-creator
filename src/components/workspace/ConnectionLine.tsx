import React, { useState, useId } from 'react';
import { Connection } from '@/hooks/useConnections';

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

/** Build a smooth cubic-bezier from source right-center to target left-center */
function buildEdgePath(
  sx: number, sy: number,
  tx: number, ty: number,
) {
  // Horizontal offset for control points — adapts to distance
  const dx = Math.abs(tx - sx);
  const offset = Math.max(40, Math.min(dx * 0.45, 180));

  return `M ${sx} ${sy} C ${sx + offset} ${sy}, ${tx - offset} ${ty}, ${tx} ${ty}`;
}

/** Point along cubic bezier at t ∈ [0,1] */
function bezierPoint(
  sx: number, sy: number,
  c1x: number, c1y: number,
  c2x: number, c2y: number,
  tx: number, ty: number,
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * tx,
    y: u * u * u * sy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ty,
  };
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  elementPositions,
  onRemove,
}) => {
  const [hover, setHover] = useState(false);
  const uid = useId();

  const sourceEl = elementPositions.find(el => el.id === connection.sourceId);
  const targetEl = elementPositions.find(el => el.id === connection.targetId);
  if (!sourceEl || !targetEl) return null;

  // Anchors: right-center of source, left-center of target
  const sx = sourceEl.x + sourceEl.width;
  const sy = sourceEl.y + sourceEl.height / 2;
  const tx = targetEl.x;
  const ty = targetEl.y + targetEl.height / 2;

  const dx = Math.abs(tx - sx);
  const offset = Math.max(40, Math.min(dx * 0.45, 180));

  const pathData = buildEdgePath(sx, sy, tx, ty);

  // Midpoint for delete button
  const mid = bezierPoint(sx, sy, sx + offset, sy, tx - offset, ty, tx, ty, 0.5);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(connection.id);
  };

  const markerId = `arrow-${uid}`;
  const strokeColor = hover ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.55)';
  const strokeW = hover ? 2.5 : 1.8;

  return (
    <g
      className="connection-line"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Arrowhead marker */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 8"
          refX="9"
          refY="4"
          markerWidth="10"
          markerHeight="8"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0.5 L 9 4 L 0 7.5 Z"
            fill={strokeColor}
            style={{ transition: 'fill 0.15s ease-out' }}
          />
        </marker>
      </defs>

      {/* Invisible wider hit-area for hover detection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
      />

      {/* Visible edge */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeW}
        markerEnd={`url(#${markerId})`}
        strokeLinecap="round"
        style={{
          transition: 'stroke 0.15s ease-out, stroke-width 0.15s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Small source dot */}
      <circle
        cx={sx}
        cy={sy}
        r={hover ? 4 : 3}
        fill={strokeColor}
        style={{ transition: 'all 0.15s ease-out', pointerEvents: 'none' }}
      />

      {/* Delete button on hover */}
      {hover && (
        <g
          transform={`translate(${mid.x}, ${mid.y})`}
          onClick={handleRemove}
          style={{ cursor: 'pointer' }}
        >
          <circle
            r={10}
            fill="hsl(var(--destructive))"
            stroke="hsl(var(--background))"
            strokeWidth={1.5}
          />
          {/* Pure SVG × icon — no foreignObject */}
          <line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
          <line x1={3.5} y1={-3.5} x2={-3.5} y2={3.5} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

export { buildEdgePath };
export default ConnectionLine;
