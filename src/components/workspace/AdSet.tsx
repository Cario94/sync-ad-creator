import React, { useState } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Users, Link } from 'lucide-react';
import AdSetDialog from './dialogs/AdSetDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';

interface AdSetProps {
  name: string;
  initialPosition?: { x: number; y: number };
  id?: string;
  elementRef?: (element: HTMLDivElement | null) => void;
  isCreatingConnection?: boolean;
  activeConnectionId?: string;
  onStartConnection?: () => void;
  onCompleteConnection?: () => void;
}

const AdSet: React.FC<AdSetProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `adset-${Date.now()}`,
  elementRef,
  isCreatingConnection = false,
  activeConnectionId,
  onStartConnection,
  onCompleteConnection,
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

  const { position, isDragging, dragRef, handleMouseDown } = useDragAndDrop({
    initialPosition
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogOpen(true);
  };

  const handleSave = (updatedAdSet: any) => {
    setAdSetData(updatedAdSet);
  };

  const handleDelete = () => {
    console.log(`Delete ad set: ${adSetData.id}`);
  };

  const isActiveConnection = activeConnectionId === id;
  const isConnectionTarget = isCreatingConnection && !isActiveConnection;

  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartConnection) onStartConnection();
  };

  const handleConnectionComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnectionTarget && onCompleteConnection) onCompleteConnection();
  };

  const combinedRef = (el: HTMLDivElement | null) => {
    if (dragRef) {
      dragRef.current = el;
    }
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
            <div className="w-8 h-8 rounded-full bg-accent-foreground/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="font-medium text-sm">Ad Set</div>
          </div>
          <h3 className="font-semibold text-base">{adSetData.name}</h3>
          <div className="mt-2 text-xs text-muted-foreground">
            Budget: ${adSetData.budget}/day • Locations: {adSetData.locations.join(', ')}
          </div>
          
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
