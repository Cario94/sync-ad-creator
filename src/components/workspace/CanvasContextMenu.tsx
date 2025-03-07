
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Copy, Trash, Scissors, ClipboardPaste, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onEdit?: () => void;
  elementType?: 'campaign' | 'adset' | 'ad' | '';
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ 
  children, 
  onEdit,
  elementType = '' 
}) => {
  const handleAction = (action: string) => {
    if (action === 'edit' && onEdit) {
      onEdit();
    } else {
      toast(`${action} ${elementType}`, {
        description: 'This functionality will be available in the full version'
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {elementType && (
          <>
            <ContextMenuItem onClick={() => onEdit && onEdit()}>
              <Edit className="mr-2 h-4 w-4" />
              Edit {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleAction('duplicate')}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleAction('cut')}>
              <Scissors className="mr-2 h-4 w-4" />
              Cut
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleAction('delete')}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
        {!elementType && (
          <>
            <ContextMenuItem onClick={() => handleAction('paste')}>
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Paste
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleAction('tidy')}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Tidy Layout
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default CanvasContextMenu;
