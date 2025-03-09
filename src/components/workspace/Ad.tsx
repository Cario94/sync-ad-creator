import React, { useState, useEffect } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { ImageIcon } from 'lucide-react';
import AdDialog from './dialogs/AdDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';

interface AdProps {
  name: string;
  initialPosition?: { x: number; y: number };
  id?: string;
  isSelected?: boolean;
  elementRef?: (element: HTMLDivElement | null) => void;
  isCreatingConnection?: boolean;
  activeConnectionId?: string;
  onSelect?: () => void;
  onCompleteConnection?: () => void;
  onUpdatePosition?: (position: { x: number; y: number }) => void;
}

const Ad: React.FC<AdProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `ad-${Date.now()}`,
  isSelected = false,
  elementRef,
  isCreatingConnection = false,
  activeConnectionId,
  onSelect,
  onCompleteConnection,
  onUpdatePosition,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adData, setAdData] = useState({
    id,
    name,
    adSetId: '',
    primaryText: '',
    headline: name,
    description: '',
    callToAction: 'learn_more',
    destinationUrl: 'https://',
    displayUrl: '',
    imageUrl: '',
  });

  const { position, isDragging, isSelected: dragSelected, setIsSelected, dragRef, handleMouseDown, handleClick } = useDragAndDrop({
    initialPosition,
    onSelect,
  });

  // Sync external selection state
  useEffect(() => {
    setIsSelected(isSelected);
  }, [isSelected, setIsSelected]);

  // Sync position with parent component when dragging
  useEffect(() => {
    if (onUpdatePosition && (position.x !== initialPosition.x || position.y !== initialPosition.y)) {
      onUpdatePosition(position);
    }
  }, [position, initialPosition, onUpdatePosition]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogOpen(true);
  };

  const handleSave = (updatedAd: any) => {
    setAdData(updatedAd);
  };

  const handleDelete = () => {
    // In a real implementation, this would remove the ad from the canvas
    console.log(`Delete ad: ${adData.id}`);
  };

  const isActiveConnection = activeConnectionId === id;
  const isConnectionTarget = isCreatingConnection && !isActiveConnection;

  const handleConnectionComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnectionTarget && onCompleteConnection) onCompleteConnection();
  };

  // Set up the combined ref for both dragging and positioning
  const combinedRef = (el: HTMLDivElement | null) => {
    dragRef(el);
    if (elementRef) {
      elementRef(el);
    }
  };

  return (
    <>
      <CanvasContextMenu onEdit={() => setDialogOpen(true)} elementType="ad">
        <div
          ref={combinedRef}
          className={cn(
            "absolute p-4 w-64 rounded-lg glass-dark shadow-sm border border-muted-foreground/30 cursor-grab",
            isDragging ? "cursor-grabbing shadow-md opacity-90 z-50" : "z-10",
            isSelected ? "ring-2 ring-primary shadow-md z-20" : "",
            isActiveConnection ? "ring-2 ring-primary" : "",
            isConnectionTarget ? "ring-2 ring-primary/50 cursor-cell" : "",
            "transition-shadow duration-200"
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseDown={(e) => {
            if (isCreatingConnection) {
              handleConnectionComplete(e);
            } else {
              handleMouseDown(e);
            }
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-medium text-sm">Ad</div>
          </div>
          <h3 className="font-semibold text-base">{adData.name}</h3>
          
          {adData.imageUrl && (
            <div className="mt-2 mb-2 h-20 rounded-md overflow-hidden bg-secondary/30">
              <img 
                src={adData.imageUrl} 
                alt={adData.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="mt-2 text-xs text-muted-foreground">
            Format: Image • Status: Active
          </div>
        </div>
      </CanvasContextMenu>

      <AdDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ad={adData}
        onSave={handleSave}
        onDelete={handleDelete}
        adSets={[
          { id: 'adset-1', name: 'Women 25-34' }
        ]}
      />
    </>
  );
};

export default Ad;
