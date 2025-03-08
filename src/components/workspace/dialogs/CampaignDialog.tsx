import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: any;
  onSave: (campaign: any) => void;
  onDelete: () => void;
}

const CampaignDialog: React.FC<CampaignDialogProps> = ({
  open,
  onOpenChange,
  campaign,
  onSave,
  onDelete
}) => {
  const handleSave = () => {
    onSave(campaign);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Make changes to your campaign settings. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        {/* Campaign form would go here */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Campaign settings form would go here in a full implementation.
          </p>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
          <Button onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
