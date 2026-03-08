import React, { useState, useEffect } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Megaphone, Link } from 'lucide-react';
import CampaignDialog from './dialogs/CampaignDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';
import { CanvasElement, hydrateCampaignConfig } from './types/canvas';
import NodeValidationBadge from './NodeValidationBadge';
import { useNodeValidation } from '@/hooks/useNodeValidation';
import type { Viewport } from '@/hooks/useCanvasInteraction';

interface CampaignProps {
  name: string;
  config?: Record<string, unknown>;
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
  onEdit?: (updates: Partial<CanvasElement>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  viewport?: Viewport;
  containerRef?: React.RefObject<HTMLDivElement>;
  snapSize?: number;
  onDragEnd?: () => void;
}

const Campaign: React.FC<CampaignProps> = ({
  name,
  config = {},
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
  onEdit,
  onDelete,
  onDuplicate,
  viewport,
  containerRef,
  snapSize = 0,
  onDragEnd: onDragEndProp,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const typed = hydrateCampaignConfig(config);
  const validation = useNodeValidation(id);
  const errCount = validation?.issues.filter(i => i.severity === 'error').length ?? 0;
  const warnCount = validation?.issues.filter(i => i.severity === 'warning').length ?? 0;

  const { position, isDragging, setIsSelected, dragRef, handleMouseDown, handleClick } = useDragAndDrop({
    initialPosition,
    onSelect,
    viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
    containerRef,
    snapSize,
    nodeId: id,
    onDragEnd: onDragEndProp,
  });

  useEffect(() => { setIsSelected(isSelected); }, [isSelected, setIsSelected]);

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

  const handleSave = (updated: Record<string, unknown> & { name: string }) => {
    const { name: newName, ...rest } = updated;
    onEdit?.({ name: newName, config: rest });
  };

  const isActiveConnection = activeConnectionId === id;
  const isConnectionTarget = isCreatingConnection && !isActiveConnection;

  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.();
  };

  const handleConnectionComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnectionTarget) onCompleteConnection?.();
  };

  const combinedRef = (el: HTMLDivElement | null) => {
    dragRef(el);
    elementRef?.(el);
  };

  return (
    <>
      <CanvasContextMenu
        onEdit={() => setDialogOpen(true)}
        onConnect={onStartConnection}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        elementType="campaign"
      >
        <div
          ref={combinedRef}
          className={cn(
            "absolute p-5 w-72 rounded-xl glass-dark shadow-lg border-2 border-primary/40 cursor-grab relative",
            isDragging ? "cursor-grabbing shadow-xl opacity-90 z-50" : "z-10",
            isSelected ? "ring-2 ring-primary shadow-xl z-20" : "",
            isActiveConnection ? "ring-2 ring-primary" : "",
            isConnectionTarget ? "ring-2 ring-primary/50 cursor-cell" : "",
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            transition: isDragging ? 'none' : 'box-shadow 0.15s, transform 0.15s',
            minHeight: '140px',
          }}
          onMouseDown={(e) => {
            if (isCreatingConnection) handleConnectionComplete(e);
            else handleMouseDown(e);
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <NodeValidationBadge errors={errCount} warnings={warnCount} />
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="font-semibold text-sm uppercase tracking-wide text-primary">Campaign</div>
          </div>
          <h3 className="font-bold text-lg mb-1">{name}</h3>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            Objective: {typed.objective.charAt(0).toUpperCase() + typed.objective.slice(1)} • {typed.status}
          </div>

          <button
            className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-primary/80 transition-colors"
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
        campaignId={id}
        campaignName={name}
        config={typed}
        onSave={handleSave}
        onDelete={onDelete}
      />
    </>
  );
};

export default Campaign;
