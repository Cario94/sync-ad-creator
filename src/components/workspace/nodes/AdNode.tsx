import React, { useState, memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hydrateAdConfig, type CanvasElement } from '../types/canvas';
import NodeValidationBadge from '../NodeValidationBadge';
import { useNodeValidation } from '@/hooks/useNodeValidation';
import AdDialog from '../dialogs/AdDialog';
import CanvasContextMenu from '../CanvasContextMenu';

export type AdNodeData = {
  label: string;
  config: Record<string, unknown>;
  elementId: string;
  adSets: { id: string; name: string }[];
  onEdit: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
};

export type AdNodeType = Node<AdNodeData, 'ad'>;

const AdNode: React.FC<NodeProps<AdNodeType>> = ({ data, selected }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const typed = hydrateAdConfig(data.config);
  const validation = useNodeValidation(data.elementId);
  const errCount = validation?.issues.filter(i => i.severity === 'error').length ?? 0;
  const warnCount = validation?.issues.filter(i => i.severity === 'warning').length ?? 0;

  const handleSave = (updated: Record<string, unknown> & { name: string }) => {
    const { name: newName, ...rest } = updated;
    data.onEdit(data.elementId, { name: newName, config: rest });
  };

  return (
    <>
      <CanvasContextMenu
        onEdit={() => setDialogOpen(true)}
        onDelete={() => data.onDelete(data.elementId)}
        onDuplicate={() => data.onDuplicate(data.elementId)}
        onDuplicateSelected={data.onDuplicateSelected}
        onDeleteSelected={data.onDeleteSelected}
        selectedCount={data.selectedCount}
        elementType="ad"
      >
        <div
          className={cn(
            'p-3.5 bg-card border border-muted-foreground/50 rounded-xl shadow-sm relative',
            selected ? 'ring-2 ring-primary shadow-md' : '',
          )}
          style={{ width: '240px', minHeight: '120px' }}
          onDoubleClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
        >
          <NodeValidationBadge errors={errCount} warnings={warnCount} />
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Ad</div>
          </div>
          <h3 className="font-semibold text-sm mb-1">{data.label}</h3>

          {typed.imageUrl && (
            <div className="mt-2 mb-2 h-20 rounded-md overflow-hidden bg-secondary/30">
              <img src={typed.imageUrl} alt={data.label} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="mt-2 text-xs text-muted-foreground">
            {typed.headline ? typed.headline : 'No headline'} • {typed.callToAction.replace(/_/g, ' ')}
          </div>

          <Handle
            type="target"
            position={Position.Left}
            className="!w-3.5 !h-3.5 !bg-muted-foreground/65 !border-2 !border-background !shadow-sm"
            style={{ top: '50%' }}
          />
        </div>
      </CanvasContextMenu>

      <AdDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        adId={data.elementId}
        adName={data.label}
        config={typed}
        onSave={handleSave}
        onDelete={() => data.onDelete(data.elementId)}
        adSets={data.adSets}
      />
    </>
  );
};

export default memo(AdNode);
