import React, { useState, useEffect } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { ImageIcon } from 'lucide-react';
import AdDialog from './dialogs/AdDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';
import { CanvasElement, hydrateAdConfig } from './types/canvas';
import NodeValidationBadge from './NodeValidationBadge';
import { useNodeValidation } from '@/hooks/useNodeValidation';

interface AdProps {
  name: string;
  config?: Record<string, unknown>;
  initialPosition?: { x: number; y: number };
  id?: string;
  isSelected?: boolean;
  elementRef?: (element: HTMLDivElement | null) => void;
  isCreatingConnection?: boolean;
  activeConnectionId?: string;
  onSelect?: () => void;
  onCompleteConnection?: () => void;
  onUpdatePosition?: (position: { x: number; y: number }) => void;
  onEdit?: (updates: Partial<CanvasElement>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  adSets?: { id: string; name: string }[];
}

const Ad: React.FC<AdProps> = ({ 
  name, 
  config = {},
  initialPosition = { x: 0, y: 0 },
  id = `ad-${Date.now()}`,
  isSelected = false,
  elementRef,
  isCreatingConnection = false,
  activeConnectionId,
  onSelect,
  onCompleteConnection,
  onUpdatePosition,
  onEdit,
  onDelete,
  onDuplicate,
  adSets = [],
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const typed = hydrateAdConfig(config);
  const validation = useNodeValidation(id);
  const errCount = validation?.issues.filter(i => i.severity === 'error').length ?? 0;
  const warnCount = validation?.issues.filter(i => i.severity === 'warning').length ?? 0;

  const { position, isDragging, setIsSelected, dragRef, handleMouseDown, handleClick } = useDragAndDrop({
    initialPosition,
    onSelect,
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
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        elementType="ad"
      >
        <div
          ref={combinedRef}
          className={cn(
            "absolute p-3.5 w-60 rounded-lg glass-dark shadow-sm border border-muted-foreground/30 cursor-grab",
            isDragging ? "cursor-grabbing shadow-md opacity-90 z-50" : "z-10",
            isSelected ? "ring-2 ring-primary shadow-md z-20" : "",
            isActiveConnection ? "ring-2 ring-primary" : "",
            isConnectionTarget ? "ring-2 ring-primary/50 cursor-cell" : "",
            "transition-all duration-150"
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            minHeight: '120px',
            width: '240px'
          }}
          onMouseDown={(e) => {
            if (isCreatingConnection) handleConnectionComplete(e);
            else handleMouseDown(e);
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Ad</div>
          </div>
          <h3 className="font-semibold text-sm mb-1">{name}</h3>
          
          {typed.imageUrl && (
            <div className="mt-2 mb-2 h-20 rounded-md overflow-hidden bg-secondary/30">
              <img src={typed.imageUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="mt-2 text-xs text-muted-foreground">
            {typed.headline ? typed.headline : 'No headline'} • {typed.callToAction.replace(/_/g, ' ')}
          </div>
        </div>
      </CanvasContextMenu>

      <AdDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        adId={id}
        adName={name}
        config={typed}
        onSave={handleSave}
        onDelete={onDelete}
        adSets={adSets}
      />
    </>
  );
};

export default Ad;
