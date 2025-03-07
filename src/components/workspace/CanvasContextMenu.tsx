
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
import { Pencil, Copy, Trash, Link, Plus } from 'lucide-react';

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onConnect?: () => void;
  elementType: string;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onConnect,
  elementType
}) => {
  // If it's the canvas (empty element type), show the canvas context menu
  if (!elementType) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Campaign</span>
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Ad Set</span>
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2">
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
          <ContextMenuItem>Save Workspace</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // For campaign, ad set, and ad elements
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {onEdit && (
          <ContextMenuItem className="flex items-center gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span>Edit {elementType}</span>
          </ContextMenuItem>
        )}
        
        {onConnect && (
          <ContextMenuItem className="flex items-center gap-2" onClick={onConnect}>
            <Link className="h-4 w-4" />
            <span>Connect {elementType === 'campaign' ? 'to Ad Set' : elementType === 'adset' ? 'to Ad' : ''}</span>
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
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default CanvasContextMenu;
