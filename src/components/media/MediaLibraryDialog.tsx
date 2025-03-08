
import React, { useState } from 'react';
import { MediaItem, useMediaLibrary } from '@/hooks/useMediaLibrary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, Grid, List, Filter, X } from 'lucide-react';
import MediaGrid from './MediaGrid';
import MediaList from './MediaList';
import MediaUploader from './MediaUploader';

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
}

const MediaLibraryDialog: React.FC<MediaLibraryDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('browse');
  
  const { 
    mediaItems, 
    isLoading, 
    uploadMedia, 
    deleteMedia, 
    filterMedia 
  } = useMediaLibrary();

  const filteredMedia = filterMedia(searchQuery);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleUploadComplete = async (file: File, onProgress?: (progress: number) => void) => {
    const newMedia = await uploadMedia(file, onProgress);
    setActiveTab('browse');
    return newMedia;
  };
  
  const handleSelect = (item: MediaItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="mb-4">
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          defaultValue="browse" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="browse">Browse Files</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>
            
            {activeTab === 'browse' && (
              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media files..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-9 w-9"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-9 w-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <TabsContent value="browse" className="flex-1 overflow-auto m-0 border rounded-lg">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin mb-4 h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">Loading media files...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="p-12 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No media files found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Try a different search term or" : "Start by"} uploading your first media file
                  </p>
                  <Button className="mx-auto" onClick={() => setActiveTab('upload')}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Media
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <MediaGrid 
                  items={filteredMedia} 
                  onDelete={deleteMedia} 
                  onSelect={handleSelect}
                  selectable={true}
                />
              ) : (
                <MediaList 
                  items={filteredMedia} 
                  onDelete={deleteMedia}
                  onSelect={handleSelect}
                  selectable={true}
                />
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="flex-1 overflow-auto m-0">
              <div className="max-w-2xl mx-auto">
                <MediaUploader 
                  onUploadComplete={handleUploadComplete}
                />
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>Uploaded files will be automatically added to your Media Library</p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibraryDialog;
