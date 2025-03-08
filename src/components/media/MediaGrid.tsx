
import React, { useState } from 'react';
import { MediaItem } from '@/hooks/useMediaLibrary';
import { formatDistanceToNow } from 'date-fns';
import { 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Eye, 
  Download, 
  MoreVertical 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MediaPreviewDialog from './MediaPreviewDialog';

interface MediaGridProps {
  items: MediaItem[];
  onDelete: (id: string) => Promise<void>;
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
}

const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  onDelete,
  onSelect,
  selectable = false,
}) => {
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  
  const handleDelete = async (item: MediaItem) => {
    setMediaToDelete(item);
  };
  
  const confirmDelete = async () => {
    if (!mediaToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(mediaToDelete.id);
    } finally {
      setIsDeleting(false);
      setMediaToDelete(null);
    }
  };
  
  const handlePreview = (item: MediaItem) => {
    setPreviewItem(item);
  };
  
  const handleSelect = (item: MediaItem) => {
    if (onSelect) {
      onSelect(item);
    }
  };
  
  // Function to determine which icon to show based on media type
  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-12 w-12 text-muted-foreground" />;
    } else if (type.startsWith('video/')) {
      return <Video className="h-12 w-12 text-muted-foreground" />;
    } else {
      return <ImageIcon className="h-12 w-12 text-muted-foreground" />;
    }
  };
  
  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
      {items.map(item => (
        <div 
          key={item.id} 
          className={`
            group bg-white border border-border rounded-lg overflow-hidden flex flex-col transition-all duration-200
            ${selectable ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''}
          `}
          onClick={selectable ? () => handleSelect(item) : undefined}
        >
          {/* Media Preview Area */}
          <div 
            className="aspect-square relative overflow-hidden bg-secondary/30 flex items-center justify-center"
            onClick={(e) => {
              if (!selectable) {
                e.stopPropagation();
                handlePreview(item);
              }
            }}
          >
            {item.type.startsWith('image/') ? (
              <img 
                src={item.url} 
                alt={item.name}
                className="object-cover w-full h-full"
              />
            ) : item.type.startsWith('video/') ? (
              <div className="w-full h-full flex items-center justify-center relative">
                <Video className="h-12 w-12 text-muted-foreground" />
                {item.thumbnailUrl && (
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.name}
                    className="object-cover w-full h-full absolute inset-0 opacity-50"
                  />
                )}
              </div>
            ) : (
              getMediaIcon(item.type)
            )}
            
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(item);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // This would be a download function in a real app
                  window.open(item.url, '_blank');
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button 
                size="icon" 
                variant="destructive" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Info Section */}
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate" title={item.name}>
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.size)}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePreview(item)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(item)}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDistanceToNow(item.uploadedAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mediaToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Preview Dialog */}
      <MediaPreviewDialog
        item={previewItem}
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      />
    </div>
  );
};

export default MediaGrid;
