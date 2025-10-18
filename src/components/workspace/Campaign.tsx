import React, { useState, useEffect } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Megaphone, Link } from 'lucide-react';
import CampaignDialog from './dialogs/CampaignDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';

interface CampaignProps {
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

const Campaign: React.FC<CampaignProps> = ({ 
  name, 
  initialPosition = { x: 0, y: 0 },
  id = `campaign-${Date.now()}`,
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

  const handleSave = (updatedCampaign: any) => {
    setCampaignData(updatedCampaign);
  };

  const handleDelete = () => {
    // In a real implementation, this would remove the campaign from the canvas
    console.log(`Delete campaign: ${campaignData.id}`);
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
        elementType="campaign"
      >
        <div
          ref={combinedRef}
          className={cn(
            "absolute p-5 w-72 rounded-xl glass-dark shadow-lg border-2 border-primary/40 cursor-grab",
            isDragging ? "cursor-grabbing shadow-xl opacity-90 z-50" : "z-10",
            isSelected ? "ring-2 ring-primary shadow-xl z-20" : "",
            isActiveConnection ? "ring-2 ring-primary" : "",
            isConnectionTarget ? "ring-2 ring-primary/50 cursor-cell" : "",
            "transition-all duration-150"
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            minHeight: '140px'
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
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="font-semibold text-sm uppercase tracking-wide text-primary">Campaign</div>
          </div>
          <h3 className="font-bold text-lg mb-1">{campaignData.name}</h3>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            Objective: {campaignData.objective.charAt(0).toUpperCase() + campaignData.objective.slice(1)}
          </div>
          
          {/* Connection button */}
          <button
            className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm hover:bg-primary/80 transition-colors"
            onClick={handleConnectionStart}
            title="Connect to Ad Set"
          >
            <Link size={12} />
          </button>
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
