
import React from 'react';
import { MediaItem } from '@/hooks/useMediaLibrary';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Info, Image as ImageIcon, Video } from 'lucide-react';

interface MediaPreviewDialogProps {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item: MediaItem) => void;
}

const MediaPreviewDialog: React.FC<MediaPreviewDialogProps> = ({
  item,
  open,
  onOpenChange,
  onSelect,
}) => {
  if (!item) return null;
  
  const handleSelect = () => {
    if (onSelect && item) {
      onSelect(item);
      onOpenChange(false);
    }
  };
  
  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {item.type.startsWith('image/') ? (
              <ImageIcon className="h-5 w-5 mr-2" />
            ) : item.type.startsWith('video/') ? (
              <Video className="h-5 w-5 mr-2" />
            ) : null}
            {item.name}
          </DialogTitle>
          <DialogDescription>
            Uploaded {formatDistanceToNow(item.uploadedAt, { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-auto mt-4">
          <div className="bg-secondary/20 rounded-lg flex items-center justify-center p-4">
            {item.type.startsWith('image/') ? (
              <img 
                src={item.url} 
                alt={item.name}
                className="max-w-full max-h-[60vh] object-contain"
              />
            ) : item.type.startsWith('video/') ? (
              <video 
                src={item.url} 
                controls
                className="max-w-full max-h-[60vh]"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center py-12">
                <div className="bg-secondary/30 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Preview not available</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 bg-secondary/10 rounded-lg p-4">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Info className="h-4 w-4 mr-2" />
              File Details
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Type:</div>
              <div>{item.type}</div>
              
              <div className="text-muted-foreground">Size:</div>
              <div>{formatFileSize(item.size)}</div>
              
              {item.dimensions && (
                <>
                  <div className="text-muted-foreground">Dimensions:</div>
                  <div>{item.dimensions.width} × {item.dimensions.height}px</div>
                </>
              )}
              
              <div className="text-muted-foreground">Uploaded:</div>
              <div>{item.uploadedAt.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          
          <div className="flex space-x-2">
            {onSelect && (
              <Button onClick={handleSelect}>
                Select
              </Button>
            )}
            <Button variant="secondary" onClick={() => window.open(item.url, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreviewDialog;
