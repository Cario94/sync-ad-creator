import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CanvasElement } from './types/canvas';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** The elements that will be removed (including cascade children) */
  affectedElements: CanvasElement[];
  /** The elements the user explicitly selected for deletion */
  directTargets: CanvasElement[];
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open, onOpenChange, onConfirm, affectedElements, directTargets,
}) => {
  const cascadeExtras = affectedElements.filter(
    el => !directTargets.some(t => t.id === el.id)
  );
  const hasCascade = cascadeExtras.length > 0;

  const campaigns = affectedElements.filter(e => e.type === 'campaign');
  const adSets = affectedElements.filter(e => e.type === 'adset');
  const ads = affectedElements.filter(e => e.type === 'ad');

  const buildSummary = () => {
    const parts: string[] = [];
    if (campaigns.length > 0) parts.push(`${campaigns.length} Campaign${campaigns.length > 1 ? 's' : ''}`);
    if (adSets.length > 0) parts.push(`${adSets.length} Ad Set${adSets.length > 1 ? 's' : ''}`);
    if (ads.length > 0) parts.push(`${ads.length} Ad${ads.length > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasCascade ? 'Delete with connected elements?' : 'Delete element?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              This will permanently remove <strong>{buildSummary()}</strong> and all associated connections.
            </span>
            {hasCascade && (
              <span className="block text-destructive">
                {cascadeExtras.length} connected child element{cascadeExtras.length > 1 ? 's' : ''} will also be deleted.
              </span>
            )}
            <span className="block text-muted-foreground text-xs">This action can be undone with Ctrl+Z.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete{hasCascade ? ` (${affectedElements.length} items)` : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
