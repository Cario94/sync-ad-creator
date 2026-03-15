import React, { useCallback, useMemo, useRef, useState } from 'react';
import { MediaItem, useMediaLibrary } from '@/hooks/useMediaLibrary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, Grid, List, X } from 'lucide-react';
import MediaGrid from './MediaGrid';
import MediaList from './MediaList';
import MediaUploader from './MediaUploader';

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
}

const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 500;
const PANEL_MARGIN = 24;

const getDefaultPanelPosition = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: Math.max(PANEL_MARGIN, window.innerWidth - PANEL_WIDTH - PANEL_MARGIN),
    y: Math.max(PANEL_MARGIN, window.innerHeight - PANEL_HEIGHT - PANEL_MARGIN),
  };
};

const MediaLibraryDialog: React.FC<MediaLibraryDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('browse');
  const [position, setPosition] = useState(getDefaultPanelPosition);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const {
    isLoading,
    uploadMedia,
    deleteMedia,
    filterMedia,
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
  };

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };

    const onMouseMove = (moveEvt: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const nextX = drag.originX + (moveEvt.clientX - drag.startX);
      const nextY = drag.originY + (moveEvt.clientY - drag.startY);
      setPosition({
        x: Math.max(0, nextX),
        y: Math.max(0, nextY),
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [position.x, position.y]);

  const panelStyle = useMemo(
    () => ({ width: PANEL_WIDTH, height: PANEL_HEIGHT, left: position.x, top: position.y }),
    [position.x, position.y],
  );

  if (!open) return null;

  return (
    <div
      className="fixed z-[120] bg-card border border-border rounded-lg shadow-xl flex flex-col"
      style={panelStyle}
    >
      <div
        className="h-12 px-4 border-b border-border flex items-center justify-between cursor-move select-none"
        onMouseDown={handleHeaderMouseDown}
      >
        <h2 className="font-semibold text-sm">Media Library</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 flex-1 min-h-0 flex flex-col">
        <Tabs
          defaultValue="browse"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between mb-3 gap-2">
            <TabsList>
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            {activeTab === 'browse' && (
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {activeTab === 'browse' && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media files..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <TabsContent value="browse" className="flex-1 overflow-auto m-0 border rounded-lg">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin mb-4 h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">Loading media files...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="p-8 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-medium mb-2">No media files found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term or' : 'Start by'} uploading your first media file
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
              <MediaUploader onUploadComplete={handleUploadComplete} />
              <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>Uploaded files will be automatically added to your Media Library</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MediaLibraryDialog;
