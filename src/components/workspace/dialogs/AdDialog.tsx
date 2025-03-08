
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

interface AdSet {
  id: string;
  name: string;
}

interface AdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: any;
  onSave: (ad: any) => void;
  onDelete: () => void;
  adSets: AdSet[];
}

const AdDialog: React.FC<AdDialogProps> = ({
  open,
  onOpenChange,
  ad,
  onSave,
  onDelete,
  adSets
}) => {
  const handleSave = () => {
    onSave(ad);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ad</DialogTitle>
          <DialogDescription>
            Update your ad creative and settings. Changes will be reflected in the preview.
          </DialogDescription>
        </DialogHeader>
        
        {/* Ad form would go here */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Ad settings form would go here in a full implementation.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Available ad sets: {adSets.map(as => as.name).join(', ')}
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

export default AdDialog;
