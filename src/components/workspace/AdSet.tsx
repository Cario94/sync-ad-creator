import React, { useState, useEffect } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Users, Link } from 'lucide-react';
import AdSetDialog from './dialogs/AdSetDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';

interface AdSetProps {
  name: string;
  initialPosition?: { x: number; y: number };
  id?: string;
  isSelected?: boolean;
  elementRef?: (element: HTMLDivElement | null) => void;
  isCreatingConnection?: boolean;
  activeConnectionId?: string;
  onSelect?: () => void;
  onStartConnection?: () => void;
  onCompleteConnection?: () => void;
  onUpdatePosition?: (position: { x: number; y: number }) => void;
}

const AdSet: React.FC<AdSetProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `adset-${Date.now()}`,
  isSelected = false,
  elementRef,
  isCreatingConnection = false,
  activeConnectionId,
  onSelect,
  onStartConnection,
  onCompleteConnection,
  onUpdatePosition,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adSetData, setAdSetData] = useState({
    id,
    name,
    campaignId: '',
    budgetType: 'campaign',
    budget: 20,
    startDate: new Date(),
    ageMin: 18,
    ageMax: 65,
    gender: 'all',
    locations: ['United States'],
    placements: [],
    bidStrategy: 'lowest_cost',
    optimizationGoal: 'clicks'
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

  const handleSave = (updatedAdSet: any) => {
    setAdSetData(updatedAdSet);
  };

  const handleDelete = () => {
    // In a real implementation, this would remove the ad set from the canvas
    console.log(`Delete ad set: ${adSetData.id}`);
  };

  const isActiveConnection = activeConnectionId === id;
  const isConnectionTarget = isCreatingConnection && !isActiveConnection;

  // Handle connection operations
  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartConnection) onStartConnection();
  };

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
      <CanvasContextMenu 
        onEdit={() => setDialogOpen(true)} 
        onConnect={onStartConnection}
        elementType="adset"
      >
        <div
          ref={combinedRef}
          className={cn(
            "absolute p-4 w-64 rounded-lg glass-dark shadow-sm border border-accent-foreground/30 cursor-grab",
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
            <div className="w-8 h-8 rounded-full bg-accent-foreground/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="font-medium text-sm">Ad Set</div>
          </div>
          <h3 className="font-semibold text-base">{adSetData.name}</h3>
          <div className="mt-2 text-xs text-muted-foreground">
            Budget: ${adSetData.budget}/day • Locations: {adSetData.locations.join(', ')}
          </div>
          
          {/* Connection button */}
          <button
            className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm hover:bg-primary/80 transition-colors"
            onClick={handleConnectionStart}
            title="Connect to Ad"
          >
            <Link size={12} />
          </button>
        </div>
      </CanvasContextMenu>

      <AdSetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        adSet={adSetData}
        onSave={handleSave}
        onDelete={handleDelete}
        campaigns={[
          { id: 'campaign-1', name: 'Summer Sale 2023' }
        ]}
      />
    </>
  );
};

export default AdSet;
