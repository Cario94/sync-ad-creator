
import React from 'react';
import CanvasContextMenu from './CanvasContextMenu';
import ZoomControls from './ZoomControls';
import CanvasElements, { CanvasElement } from './CanvasElements';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';

interface CanvasProps {
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ className = '' }) => {
  // Use the custom hook for all canvas interactions
  const {
    canvasRef,
    scale,
    isDragging,
    pan,
    spacePressed,
    handleZoomIn,
    handleZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasInteraction();
  
  // Demo data - in a real app, this would come from state/context
  const elements: CanvasElement[] = [
    { id: 'campaign-1', type: 'campaign', name: 'Summer Sale 2023', position: { x: 100, y: 100 } },
    { id: 'adset-1', type: 'adset', name: 'Women 25-34', position: { x: 400, y: 200 } },
    { id: 'ad-1', type: 'ad', name: 'Product Showcase', position: { x: 700, y: 300 } },
  ];
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-secondary/20">
      {/* Zoom controls */}
      <ZoomControls 
        scale={scale} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
      />
      
      <CanvasContextMenu elementType="">
        <div 
          ref={canvasRef}
          className={`workspace-canvas w-full h-full ${className} ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isDragging && spacePressed ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s'
          }}
        >
          {/* Render workspace elements */}
          <CanvasElements elements={elements} />
        </div>
      </CanvasContextMenu>
    </div>
  );
};

export default Canvas;
