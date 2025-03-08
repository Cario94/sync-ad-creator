
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

interface Campaign {
  id: string;
  name: string;
}

interface AdSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adSet: any;
  onSave: (adSet: any) => void;
  onDelete: () => void;
  campaigns: Campaign[];
}

const AdSetDialog: React.FC<AdSetDialogProps> = ({
  open,
  onOpenChange,
  adSet,
  onSave,
  onDelete,
  campaigns
}) => {
  const handleSave = () => {
    onSave(adSet);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ad Set</DialogTitle>
          <DialogDescription>
            Modify your ad set targeting and budget settings here.
          </DialogDescription>
        </DialogHeader>
        
        {/* Ad Set form would go here */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Ad Set settings form would go here in a full implementation.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Available campaigns: {campaigns.map(c => c.name).join(', ')}
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

export default AdSetDialog;
