import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type PanelRect = { x: number; y: number; width: number; height: number };

const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 500;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 420;
const PANEL_MARGIN = 24;

const getDefaultPanelRect = (): PanelRect => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  }

  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: Math.max(PANEL_MARGIN, window.innerWidth - DEFAULT_WIDTH - PANEL_MARGIN),
    y: Math.max(PANEL_MARGIN, window.innerHeight - DEFAULT_HEIGHT - PANEL_MARGIN),
  };
};

const clampRectToViewport = (rect: PanelRect): PanelRect => {
  if (typeof window === 'undefined') return rect;

  const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
  const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - PANEL_MARGIN * 2);
  const width = Math.min(maxWidth, Math.max(MIN_WIDTH, rect.width));
  const height = Math.min(maxHeight, Math.max(MIN_HEIGHT, rect.height));

  return {
    width,
    height,
    x: Math.min(Math.max(0, rect.x), Math.max(0, window.innerWidth - width)),
    y: Math.min(Math.max(0, rect.y), Math.max(0, window.innerHeight - height)),
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
  const [panelRect, setPanelRect] = useState<PanelRect>(() => clampRectToViewport(getDefaultPanelRect()));

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startRect: PanelRect } | null>(null);

  const {
    isLoading,
    uploadMedia,
    deleteMedia,
    filterMedia,
  } = useMediaLibrary();

  const filteredMedia = filterMedia(searchQuery);

  useEffect(() => {
    const handleResize = () => {
      setPanelRect(prev => clampRectToViewport(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const startPointerInteraction = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: 'drag' | 'resize',
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startRect: panelRect,
    };

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvt: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      const dx = moveEvt.clientX - start.pointerX;
      const dy = moveEvt.clientY - start.pointerY;

      setPanelRect(() => {
        if (mode === 'drag') {
          return clampRectToViewport({
            ...start.startRect,
            x: start.startRect.x + dx,
            y: start.startRect.y + dy,
          });
        }

        return clampRectToViewport({
          ...start.startRect,
          width: start.startRect.width + dx,
          height: start.startRect.height + dy,
        });
      });
    };

    const onPointerUp = () => {
      dragStartRef.current = null;
      document.body.style.userSelect = '';
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
  };

  const panelStyle = useMemo(
    () => ({
      width: panelRect.width,
      height: panelRect.height,
      transform: `translate3d(${panelRect.x}px, ${panelRect.y}px, 0)`,
      top: 0,
      left: 0,
    }),
    [panelRect],
  );

  if (!open) return null;

  return (
    <div
      className="fixed z-[120] bg-card border border-border rounded-lg shadow-xl flex flex-col will-change-transform"
      style={panelStyle}
    >
      <div
        className="h-12 px-4 border-b border-border flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => startPointerInteraction(e, 'drag')}
      >
        <h2 className="font-semibold text-sm">Media Library</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onPointerDown={(e) => e.stopPropagation()}
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

      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        onPointerDown={(e) => startPointerInteraction(e, 'resize')}
      >
        <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/50" />
      </div>
    </div>
  );
};

export default MediaLibraryDialog;
