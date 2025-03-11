import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Canvas from '@/components/workspace/Canvas';
import ToolBar from '@/components/workspace/ToolBar';
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Image, 
  Settings, 
  LogOut,
  User,
  DraftingCompass
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MediaItem } from '@/hooks/useMediaLibrary';
import SettingsDialog from '@/components/workspace/settings/SettingsDialog';
import ProfileDialog from '@/components/workspace/settings/ProfileDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Workspace = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const handleMediaSelect = (media: MediaItem) => {
    toast({
      title: "Media selected",
      description: `Selected: ${media.name}`
    });
    // This would typically pass the selected media to the current element being edited
  };

  const handleTidyLayout = () => {
    toast({
      title: "Tidy Layout",
      description: "Organizing elements for better visibility"
    });
    // Implementation for tidying layout would go here
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`h-full bg-white border-r border-border flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 -ml-64'
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="text-xl font-bold text-gradient">
            CampaignSync
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 px-4 py-2">
          <div className="space-y-1">
            <Button 
              variant="secondary" 
              className="w-full justify-start font-medium"
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Workspace
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMediaLibraryOpen(true)}
            >
              <Image className="mr-3 h-5 w-5" />
              Media Library
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={() => setProfileOpen(true)}>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">John Doe</div>
              <div className="text-xs text-muted-foreground">john@example.com</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
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
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Share
            </Button>
            <Button size="sm">
              Publish
            </Button>
          </div>
        </header>
        
        {/* Toolbar */}
        <div className="p-4 flex justify-center">
          <ToolBar />
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <Canvas />
          
          {/* Tidy Layout Button - Bottom Right Corner */}
          <div className="absolute bottom-20 right-4 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleTidyLayout}
                  className="rounded-full shadow-md h-10 w-10"
                >
                  <DraftingCompass className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Tidy Layout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleMediaSelect}
      />
      
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
};

export default Workspace;
