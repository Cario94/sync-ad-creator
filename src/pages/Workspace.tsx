import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Canvas, { CanvasRef } from '@/components/workspace/Canvas';
import ToolBar from '@/components/workspace/ToolBar';
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog';
import {
  Menu, X, LayoutDashboard, Image, Settings, LogOut, User, DraftingCompass, Save, Loader2, Check, AlertCircle, Circle,
  Download, FileJson, FileSpreadsheet, FileText, Copy,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MediaItem } from '@/hooks/useMediaLibrary';
import SettingsDialog from '@/components/workspace/settings/SettingsDialog';
import ProfileDialog from '@/components/workspace/settings/ProfileDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import type { SaveStatus } from '@/hooks/useProjectDocument';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportJSON, exportCSV, exportMarkdown, copyToClipboard } from '@/lib/exportUtils';
import { toast as sonnerToast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    case 'conflict':
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          Version conflict
        </span>
      );
    default:
      return null;
  }
}

/** Inner workspace that consumes WorkspaceContext */
function WorkspaceInner() {
  const {
    isLoading, error, saveStatus, save,
    addCampaign, addAdSet, addAd,
    undo, redo, elements, connections,
    markDirty, projectName,
  } = useWorkspace();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef<CanvasRef>(null);
  const { user, signOut } = useAuth();
  const { preferences } = useUserSettings();

  const handleSave = async () => {
    try {
      await save();
    } catch {
      toast({ title: 'Save failed', description: 'Could not save workspace. Please try again.', variant: 'destructive' });
    }
  };

  // Ctrl/Cmd+S shortcut (respects keyboardShortcuts pref)
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const kbEnabled = preferences.keyboardShortcuts !== false;

  React.useEffect(() => {
    if (!kbEnabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [kbEnabled]);

  // Auto-save: debounced save when status is 'unsaved'
  const autoSaveEnabled = preferences.autoSave !== false;
  React.useEffect(() => {
    if (!autoSaveEnabled || saveStatus !== 'unsaved') return;
    const timer = setTimeout(() => {
      handleSaveRef.current();
    }, 5000); // 5s debounce
    return () => clearTimeout(timer);
  }, [autoSaveEnabled, saveStatus]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    navigate('/login');
  };

  const handleMediaSelect = (media: MediaItem) => {
    toast({ title: 'Media selected', description: `Selected: ${media.name}` });
  };

  const handleTidyLayout = () => canvasRef.current?.tidyLayout();

  const handleProjectsNavigation = () => {
    if (saveStatus === 'unsaved') {
      setLeaveConfirmOpen(true);
      return;
    }

    navigate('/dashboard');
  };

  const handleSaveAndExit = async () => {
    try {
      await save();
      setLeaveConfirmOpen(false);
      navigate('/dashboard');
    } catch {
      toast({ title: 'Save failed', description: 'Could not save workspace. Please try again.', variant: 'destructive' });
    }
  };

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
        <Button onClick={() => navigate('/dashboard')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* Sidebar */}
      <div className={`h-full bg-card border-r border-border flex flex-col transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex items-center justify-between p-6">
          <Link to="/dashboard" className="text-xl font-bold text-gradient">CampaignSync</Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-2">
          <div className="mb-4 rounded-md border border-border bg-background/60 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Progetto corrente</p>
            <p className="truncate text-sm font-medium">{projectName || 'Workspace'}</p>
          </div>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleProjectsNavigation}>
              <LayoutDashboard className="mr-3 h-5 w-5" />Projects
            </Button>
            <Button variant="secondary" className="w-full justify-start font-medium">
              <DraftingCompass className="mr-3 h-5 w-5" />Workspace
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
          <div className="flex items-center">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="text-lg font-semibold ml-auto mr-auto truncate max-w-xs">{projectName || 'Workspace'}</div>
          <div className="flex items-center space-x-3">
            <SaveStatusIndicator status={saveStatus} />
            <Button
              variant={saveStatus === 'unsaved' ? 'default' : 'outline'}
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === 'saving' || saveStatus === 'idle' || saveStatus === 'saved' || saveStatus === 'conflict'}
            >
              {saveStatus === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => { exportJSON(elements, connections, projectName || 'Project'); sonnerToast.success('JSON exported'); }}>
                  <FileJson className="mr-2 h-4 w-4" /> JSON (full data)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportCSV(elements, connections, projectName || 'Project'); sonnerToast.success('CSV exported'); }}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV (spreadsheet)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportMarkdown(elements, connections, projectName || 'Project'); sonnerToast.success('Markdown exported'); }}>
                  <FileText className="mr-2 h-4 w-4" /> Markdown (summary)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { copyToClipboard(elements, connections, projectName || 'Project').then(() => sonnerToast.success('Copied to clipboard')); }}>
                  <Copy className="mr-2 h-4 w-4" /> Copy to clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Toolbar */}
        <div className="p-4 flex justify-center">
          <ToolBar
            onUndo={() => undo()}
            onRedo={() => redo()}
            onAddCampaign={addCampaign}
            onAddAdSet={addAdSet}
            onAddAd={addAd}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <Canvas ref={canvasRef} onSave={handleSave} />

          <div className="absolute bottom-28 right-3 z-10">
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
      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hai modifiche non salvate</DialogTitle>
            <DialogDescription>
              Hai modifiche non salvate. Vuoi salvare prima di tornare ai progetti?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setLeaveConfirmOpen(false)}>Annulla</Button>
            <Button variant="outline" onClick={() => { setLeaveConfirmOpen(false); navigate('/dashboard'); }}>
              Esci senza salvare
            </Button>
            <Button onClick={handleSaveAndExit} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salva ed esci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Workspace page: wraps everything in WorkspaceProvider */
const Workspace = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <WorkspaceProvider paramProjectId={projectId}>
      <WorkspaceInner />
    </WorkspaceProvider>
  );
};

export default Workspace;
