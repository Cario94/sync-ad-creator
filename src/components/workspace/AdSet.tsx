import React, { useState, useEffect } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { Users, Link } from 'lucide-react';
import AdSetDialog from './dialogs/AdSetDialog';
import CanvasContextMenu from './CanvasContextMenu';
import { cn } from '@/lib/utils';
import { CanvasElement, hydrateAdSetConfig } from './types/canvas';
import NodeValidationBadge from './NodeValidationBadge';
import { useNodeValidation } from '@/hooks/useNodeValidation';

interface AdSetProps {
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
  campaigns?: { id: string; name: string }[];
}

const AdSet: React.FC<AdSetProps> = ({ 
  name, 
  config = {},
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
  onEdit,
  onDelete,
  onDuplicate,
  campaigns = [],
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const typed = hydrateAdSetConfig(config);
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
        elementType="adset"
      >
        <div
          ref={combinedRef}
          className={cn(
            "absolute p-4 w-66 rounded-lg glass-dark shadow-md border-2 border-accent-foreground/35 cursor-grab relative",
...
          onDoubleClick={handleDoubleClick}
        >
          <NodeValidationBadge errors={errCount} warnings={warnCount} />
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-accent-foreground/15 flex items-center justify-center ring-2 ring-accent-foreground/20">
              <Users className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="font-semibold text-sm uppercase tracking-wide text-accent-foreground">Ad Set</div>
          </div>
          <h3 className="font-bold text-base mb-1">{name}</h3>
          <div className="mt-2 text-xs text-muted-foreground">
            Budget: ${typed.budget}/day • {typed.locations.join(', ')}
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
        adSetId={id}
        adSetName={name}
        config={typed}
        onSave={handleSave}
        onDelete={onDelete}
        campaigns={campaigns}
      />
    </>
  );
};

export default AdSet;
