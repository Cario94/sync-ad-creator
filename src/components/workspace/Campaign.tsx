
import React, { useState } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Megaphone } from 'lucide-react';
import CampaignDialog from './dialogs/CampaignDialog';
import CanvasContextMenu from './CanvasContextMenu';

interface CampaignProps {
  name: string;
  initialPosition?: { x: number; y: number };
  id?: string;
}

const Campaign: React.FC<CampaignProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `campaign-${Date.now()}`
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [campaignData, setCampaignData] = useState({
    id,
    name,
    objective: 'awareness',
    budget: 50,
    specialAdCategory: false,
    abTesting: false,
    buyingType: 'auction',
    budgetOptimization: true,
    bidStrategy: 'lowest_cost',
    startDate: new Date(),
    adStrategyType: 'standard',
    placementStrategy: true,
  });

  const { position, isDragging, dragRef, handleMouseDown } = useDragAndDrop({
    initialPosition
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogOpen(true);
  };

  const handleSave = (updatedCampaign: any) => {
    setCampaignData(updatedCampaign);
  };

  const handleDelete = () => {
    // In a real implementation, this would remove the campaign from the canvas
    console.log(`Delete campaign: ${campaignData.id}`);
  };

  return (
    <>
      <CanvasContextMenu onEdit={() => setDialogOpen(true)} elementType="campaign">
        <div
          ref={dragRef}
          className={`absolute p-4 w-64 rounded-lg glass-dark shadow-sm border border-primary/30 cursor-grab ${
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
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div className="font-medium text-sm">Campaign</div>
          </div>
          <h3 className="font-semibold text-base">{campaignData.name}</h3>
          <div className="mt-2 text-xs text-muted-foreground">
            Objective: {campaignData.objective.charAt(0).toUpperCase() + campaignData.objective.slice(1)}
          </div>
        </div>
      </CanvasContextMenu>

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={campaignData}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
};

export default Campaign;
