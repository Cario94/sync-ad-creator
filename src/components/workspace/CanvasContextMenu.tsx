
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Pencil, Copy, Trash, Plus } from 'lucide-react';

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  selectedCount?: number;
  onAddCampaign?: () => void;
  onAddAdSet?: () => void;
  onAddAd?: () => void;
  onSave?: () => void;
  elementType: string;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onDuplicateSelected,
  onDeleteSelected,
  selectedCount = 0,
  onAddCampaign,
  onAddAdSet,
  onAddAd,
  onSave,
  elementType
}) => {
  if (!elementType) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem className="flex items-center gap-2" onClick={onAddCampaign}>
            <Plus className="h-4 w-4" />
            <span>Add Campaign</span>
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2" onClick={onAddAdSet}>
            <Plus className="h-4 w-4" />
            <span>Add Ad Set</span>
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2" onClick={onAddAd}>
            <Plus className="h-4 w-4" />
            <span>Add Ad</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Import</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem>From JSON</ContextMenuItem>
              <ContextMenuItem>From Meta Ads</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onSave}>Save Workspace</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  const isMulti = selectedCount > 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {isMulti ? (
          <>
            {onDuplicateSelected && (
              <ContextMenuItem className="flex items-center gap-2" onClick={onDuplicateSelected}>
                <Copy className="h-4 w-4" />
                <span>Duplicate {selectedCount} selected elements</span>
              </ContextMenuItem>
            )}
            {onDeleteSelected && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                  onClick={onDeleteSelected}
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete {selectedCount} selected elements</span>
                </ContextMenuItem>
              </>
            )}
          </>
        ) : (
          <>
            {onEdit && (
              <ContextMenuItem className="flex items-center gap-2" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                <span>Edit {elementType}</span>
              </ContextMenuItem>
            )}
            {onDuplicate && (
              <ContextMenuItem className="flex items-center gap-2" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </ContextMenuItem>
            )}
            {onDelete && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete {elementType}</span>
                </ContextMenuItem>
              </>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default CanvasContextMenu;
