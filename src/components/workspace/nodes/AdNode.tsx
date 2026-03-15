import React, { useState, memo } from 'react';
import { Handle, Position, type NodeProps, type Node as FlowNode } from '@xyflow/react';
import { ImageIcon, Plus } from 'lucide-react';
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

export type AdNodeType = FlowNode<AdNodeData, 'ad'>;

const AdNode: React.FC<NodeProps<AdNodeType>> = ({ data, selected }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const typed = hydrateAdConfig(data.config);
  const validation = useNodeValidation(data.elementId);
  const errCount = validation?.issues.filter(i => i.severity === 'error').length ?? 0;
  const warnCount = validation?.issues.filter(i => i.severity === 'warning').length ?? 0;

  const handleSave = (updated: Record<string, unknown> & { name: string }) => {
    const { name: newName, ...rest } = updated;
    data.onEdit(data.elementId, { name: newName, config: rest });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('application/x-media-asset') || e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    e.preventDefault();
    e.stopPropagation();

    const serialized =
      e.dataTransfer.getData('application/x-media-asset') ||
      e.dataTransfer.getData('text/plain');

    if (!serialized) return;

    try {
      const parsed = JSON.parse(serialized) as { id?: string; url?: string };
      if (!parsed.id || !parsed.url) return;

      data.onEdit(data.elementId, {
        config: {
          ...typed,
          mediaAssetId: parsed.id,
          imageUrl: parsed.url,
        },
      });
    } catch {
      // Ignore invalid drag payloads.
    }
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
            selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md' : '',
            isDragOver ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 dark:bg-blue-950/30' : '',
          )}
          style={{ width: '240px', minHeight: '120px' }}
          onDoubleClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <NodeValidationBadge errors={errCount} warnings={warnCount} />

          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-xl pointer-events-none">
              <div className="flex flex-col items-center gap-1 text-blue-600 dark:text-blue-300">
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Drop image</span>
              </div>
            </div>
          )}

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
            className="!w-7 !h-7 !rounded-full !border-2 !border-background !shadow-md !flex !items-center !justify-center !bg-muted-foreground/40"
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
