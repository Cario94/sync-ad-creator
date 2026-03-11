import React, { useState, useCallback, useRef } from 'react';
import { MiniMap } from '@xyflow/react';

const MIN_W = 120;
const MIN_H = 90;
const MAX_W = 400;
const MAX_H = 300;

const ResizableMiniMap: React.FC = () => {
  const [size, setSize] = useState({ w: 200, h: 150 });
  const dragging = useRef(false);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [size]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startRef.current.x;
    // dragging up-right: dx increases width, -dy increases height
    const dy = startRef.current.y - e.clientY;
    setSize({
      w: Math.min(MAX_W, Math.max(MIN_W, startRef.current.w + dx)),
      h: Math.min(MAX_H, Math.max(MIN_H, startRef.current.h + dy)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className="minimap-resizable"
      style={{ width: size.w, height: size.h }}
    >
      {/* Top-right resize handle */}
      <div
        className="minimap-resize-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <MiniMap
        nodeStrokeWidth={3}
        pannable
        zoomable
        maskColor="hsl(var(--background) / 0.7)"
        style={{ position: 'relative', width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default ResizableMiniMap;
