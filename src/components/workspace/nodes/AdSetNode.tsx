import React, { useState, memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hydrateAdSetConfig, type CanvasElement } from '../types/canvas';
import NodeValidationBadge from '../NodeValidationBadge';
import { useNodeValidation } from '@/hooks/useNodeValidation';
import AdSetDialog from '../dialogs/AdSetDialog';
import CanvasContextMenu from '../CanvasContextMenu';

export type AdSetNodeData = {
  label: string;
  config: Record<string, unknown>;
  elementId: string;
  campaigns: { id: string; name: string }[];
  onEdit: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onConnectNew: () => void;
};

export type AdSetNodeType = Node<AdSetNodeData, 'adset'>;

const AdSetNode: React.FC<NodeProps<AdSetNodeType>> = ({ data, selected }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const typed = hydrateAdSetConfig(data.config);
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
        elementType="adset"
      >
        <div
          className={cn(
            'p-4 bg-card border-2 border-blue-400/60 rounded-xl shadow-md relative',
            selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' : '',
          )}
          style={{ width: '264px', minHeight: '130px' }}
          onDoubleClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
        >
          <NodeValidationBadge errors={errCount} warnings={warnCount} />
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-accent-foreground/15 flex items-center justify-center ring-2 ring-accent-foreground/20">
              <Users className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="font-semibold text-sm uppercase tracking-wide text-accent-foreground">Ad Set</div>
          </div>
          <h3 className="font-bold text-base mb-1">{data.label}</h3>
          <div className="mt-2 text-xs text-muted-foreground">
            Budget: ${typed.budget}/day • {typed.locations.join(', ')}
          </div>

          <Handle
            type="target"
            position={Position.Left}
            className="!w-7 !h-7 !rounded-full !border-2 !border-background !shadow-md !flex !items-center !justify-center !bg-accent-foreground/40"
            style={{ top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            className="!w-7 !h-7 !rounded-full !border-2 !border-background !shadow-md !flex !items-center !justify-center !bg-accent-foreground !transition-transform !duration-150 hover:!scale-110"
            style={{ top: '50%' }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              data.onConnectNew();
            }}
          >
            <ArrowRight className="!w-4 !h-4 !text-background" />
          </Handle>
        </div>
      </CanvasContextMenu>

      <AdSetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        adSetId={data.elementId}
        adSetName={data.label}
        config={typed}
        onSave={handleSave}
        onDelete={() => data.onDelete(data.elementId)}
        campaigns={data.campaigns}
      />
    </>
  );
};

export default memo(AdSetNode);
