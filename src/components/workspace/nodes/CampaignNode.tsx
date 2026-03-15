import React, { useState, memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { ArrowRight, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hydrateCampaignConfig, type CanvasElement } from '../types/canvas';
import NodeValidationBadge from '../NodeValidationBadge';
import { useNodeValidation } from '@/hooks/useNodeValidation';
import CampaignDialog from '../dialogs/CampaignDialog';
import CanvasContextMenu from '../CanvasContextMenu';

export type CampaignNodeData = {
  label: string;
  config: Record<string, unknown>;
  elementId: string;
  onEdit: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onConnectNew: () => void;
};

export type CampaignNodeType = Node<CampaignNodeData, 'campaign'>;

const CampaignNode: React.FC<NodeProps<CampaignNodeType>> = ({ data, selected }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const typed = hydrateCampaignConfig(data.config);
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
        elementType="campaign"
      >
        <div
          className={cn(
            'p-5 w-72 bg-card border-2 border-primary/70 rounded-xl shadow-md relative',
            selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl' : '',
          )}
          onDoubleClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
        >
          <NodeValidationBadge errors={errCount} warnings={warnCount} />
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="font-semibold text-sm uppercase tracking-wide text-primary">Campaign</div>
          </div>
          <h3 className="font-bold text-lg mb-1">{data.label}</h3>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            Objective: {typed.objective.charAt(0).toUpperCase() + typed.objective.slice(1)} • {typed.status}
          </div>

          {/* Source handle on the right */}
          <Handle
            type="source"
            position={Position.Right}
            className="!w-7 !h-7 !rounded-full !border-2 !border-background !shadow-md !flex !items-center !justify-center !bg-primary !transition-transform !duration-150 hover:!scale-110"
            style={{ top: '50%' }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              data.onConnectNew();
            }}
          >
            <ArrowRight className="!w-4 !h-4 !text-primary-foreground" />
          </Handle>
        </div>
      </CanvasContextMenu>

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={data.elementId}
        campaignName={data.label}
        config={typed}
        onSave={handleSave}
        onDelete={() => data.onDelete(data.elementId)}
      />
    </>
  );
};

export default memo(CampaignNode);
