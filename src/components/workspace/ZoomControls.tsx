
import React from 'react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut }) => {
  return (
    <div className="absolute bottom-6 right-6 z-10 flex items-center space-x-2 glass-morphism rounded-lg p-1">
      <button 
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary"
        aria-label="Zoom out"
      >
        -
      </button>
      <div className="text-sm font-medium">
        {Math.round(scale * 100)}%
      </div>
      <button 
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
};

export default ZoomControls;
