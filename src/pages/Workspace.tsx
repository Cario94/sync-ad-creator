import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Canvas, { CanvasRef } from '@/components/workspace/Canvas';
import ToolBar from '@/components/workspace/ToolBar';
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog';
import { 
  Menu, X, LayoutDashboard, Image, Settings, LogOut, User, DraftingCompass, Save, Loader2, Check, AlertCircle, Circle
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MediaItem } from '@/hooks/useMediaLibrary';
import SettingsDialog from '@/components/workspace/settings/SettingsDialog';
import ProfileDialog from '@/components/workspace/settings/ProfileDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectDocument, type ProjectDocumentState, type SaveStatus } from '@/hooks/useProjectDocument';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { Connection } from '@/hooks/useConnections';

/** Small pill showing current save status */
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'unsaved':
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />
          Unsaved changes
        </span>
      );
    case 'saving':
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </span>
      );
    case 'saved':
      return (
        <span className="flex items-center gap-1.5 text-xs text-primary">
          <Check className="h-3 w-3" />
          Saved
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          Save failed
        </span>
      );
    default:
      return null;
  }
}

const Workspace = () => {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const { projectId, documentState, isLoading, error, save, saveStatus, markDirty } = useProjectDocument(paramProjectId);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef<CanvasRef>(null);
  const { user, signOut } = useAuth();

  // Track latest canvas state for save
  const elementsRef = useRef<CanvasElement[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  // Count how many hydration callbacks we expect (elements + connections = 2)
  const hydrationCountRef = useRef(0);
  const hydrationDoneRef = useRef(false);

  const handleElementsChange = useCallback((elements: CanvasElement[]) => {
    elementsRef.current = elements;
    if (!hydrationDoneRef.current) {
      hydrationCountRef.current += 1;
      // After both elements and connections have fired once, hydration is done
      if (hydrationCountRef.current >= 2) hydrationDoneRef.current = true;
      return;
    }
    markDirty();
  }, [markDirty]);

  const handleConnectionsChange = useCallback((connections: Connection[]) => {
    connectionsRef.current = connections;
    if (!hydrationDoneRef.current) {
      hydrationCountRef.current += 1;
      if (hydrationCountRef.current >= 2) hydrationDoneRef.current = true;
      return;
    }
    markDirty();
  }, [markDirty]);

  const handleSave = async () => {
    const viewport = canvasRef.current?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
    const state: ProjectDocumentState = {
      elements: elementsRef.current,
      connections: connectionsRef.current,
      viewport,
    };
    try {
      await save(state);
    } catch {
      toast({ title: 'Save failed', description: 'Could not save workspace. Please try again.', variant: 'destructive' });
    }
  };

  // Ctrl/Cmd+S shortcut — use a ref to avoid stale closure
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    navigate('/login');
  };

  const handleMediaSelect = (media: MediaItem) => {
    toast({ title: 'Media selected', description: `Selected: ${media.name}` });
  };

  const handleTidyLayout = () => canvasRef.current?.tidyLayout();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className={`h-full bg-white border-r border-border flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 -ml-64'}`}>
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="text-xl font-bold text-gradient">CampaignSync</Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 px-4 py-2">
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start font-medium">
              <LayoutDashboard className="mr-3 h-5 w-5" />Workspace
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => setMediaLibraryOpen(true)}>
              <Image className="mr-3 h-5 w-5" />Media Library
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-3 h-5 w-5" />Settings
            </Button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={() => setProfileOpen(true)}>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="mr-3 h-4 w-4" />Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border px-4 flex items-center justify-between glass-morphism">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="text-lg font-semibold ml-auto mr-auto">Campaign Workspace</div>
          <div className="flex items-center space-x-3">
            <SaveStatusIndicator status={saveStatus} />
            <Button
              variant={saveStatus === 'unsaved' ? 'default' : 'outline'}
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === 'saving' || saveStatus === 'idle' || saveStatus === 'saved'}
            >
              {saveStatus === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
            <Button size="sm">Publish</Button>
          </div>
        </header>
        
        {/* Toolbar */}
        <div className="p-4 flex justify-center">
          <ToolBar 
            onUndo={() => {
              const event = new KeyboardEvent('keydown', { key: 'z', metaKey: true, ctrlKey: true });
              window.dispatchEvent(event);
            }}
            onRedo={() => {
              const event = new KeyboardEvent('keydown', { key: 'z', metaKey: true, ctrlKey: true, shiftKey: true });
              window.dispatchEvent(event);
            }}
          />
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <Canvas
            ref={canvasRef}
            initialElements={documentState?.elements}
            initialConnections={documentState?.connections as Connection[]}
            initialViewport={documentState?.viewport}
            onElementsChange={handleElementsChange}
            onConnectionsChange={handleConnectionsChange}
          />
          
          <div className="absolute bottom-20 right-4 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={handleTidyLayout} className="rounded-full shadow-md h-10 w-10">
                  <DraftingCompass className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left"><p>Tidy Layout</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <MediaLibraryDialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen} onSelect={handleMediaSelect} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
};

export default Workspace;
