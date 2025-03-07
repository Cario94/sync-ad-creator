
import React, { useState } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { ImageIcon } from 'lucide-react';
import AdDialog from './dialogs/AdDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';

interface AdProps {
  name: string;
  initialPosition?: { x: number; y: number };
  id?: string;
  elementRef?: (element: HTMLDivElement | null) => void;
  isCreatingConnection?: boolean;
  activeConnectionId?: string;
  onStartConnection?: () => void;
  onCompleteConnection?: () => void;
}

const Ad: React.FC<AdProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `ad-${Date.now()}`,
  elementRef,
  isCreatingConnection = false,
  activeConnectionId,
  onCompleteConnection,
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
  });

  const { position, isDragging, dragRef, handleMouseDown } = useDragAndDrop({
    initialPosition
  });

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
    if (dragRef) {
      // @ts-ignore - this is a hack to combine refs
      dragRef.current = el;
    }
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
          onDoubleClick={handleDoubleClick}
          onClick={(e) => {
            if (isConnectionTarget) {
              handleConnectionComplete(e);
            }
          }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-medium text-sm">Ad</div>
          </div>
          <h3 className="font-semibold text-base">{adData.name}</h3>
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
