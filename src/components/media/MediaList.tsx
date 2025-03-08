
import React, { useState } from 'react';
import { MediaItem } from '@/hooks/useMediaLibrary';
import { formatDistanceToNow } from 'date-fns';
import { 
  Image as ImageIcon, 
  Video, 
  File, 
  Trash2, 
  Eye, 
  Download, 
  MoreVertical,
  Check
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

interface MediaListProps {
  items: MediaItem[];
  onDelete: (id: string) => Promise<void>;
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
}

const MediaList: React.FC<MediaListProps> = ({
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
  const getMediaTypeIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (type.startsWith('video/')) {
      return <Video className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };
  
  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">File Name</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Type</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Size</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Upload Date</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr 
              key={item.id} 
              className={`
                border-b border-border hover:bg-secondary/20 transition-colors
                ${selectable ? 'cursor-pointer' : ''}
              `}
              onClick={selectable ? () => handleSelect(item) : undefined}
            >
              <td className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-secondary/30 flex items-center justify-center">
                    {item.type.startsWith('image/') ? (
                      <img 
                        src={item.thumbnailUrl || item.url} 
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      getMediaTypeIcon(item.type)
                    )}
                  </div>
                  <span className="font-medium text-sm truncate max-w-[200px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center space-x-2">
                  {getMediaTypeIcon(item.type)}
                  <span className="text-sm text-muted-foreground">
                    {item.type.split('/')[1]?.toUpperCase() || item.type}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(item.size)}
                </span>
              </td>
              <td className="p-3">
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(item.uploadedAt, { addSuffix: true })}
                </span>
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
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
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.url, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  {selectable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSelect(item)}>
                          <Check className="mr-2 h-4 w-4" />
                          Select
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
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
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
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

export default MediaList;
