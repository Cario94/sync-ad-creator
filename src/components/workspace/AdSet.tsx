
import React, { useState } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Users } from 'lucide-react';
import AdSetDialog from './dialogs/AdSetDialog';
import CanvasContextMenu from './CanvasContextMenu';

interface AdSetProps {
  name: string;
  initialPosition?: { x: number; y: number };
  id?: string;
}

const AdSet: React.FC<AdSetProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `adset-${Date.now()}`
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
    // In a real implementation, this would remove the ad set from the canvas
    console.log(`Delete ad set: ${adSetData.id}`);
  };

  return (
    <>
      <CanvasContextMenu onEdit={() => setDialogOpen(true)} elementType="adset">
        <div
          ref={dragRef}
          className={`absolute p-4 w-64 rounded-lg glass-dark shadow-sm border border-accent-foreground/30 cursor-grab ${
            isDragging ? 'cursor-grabbing shadow-md opacity-90 z-50' : 'z-10'
          } transition-shadow duration-200`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseDown={handleMouseDown}
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
