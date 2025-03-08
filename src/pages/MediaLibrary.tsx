
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Menu, 
  X, 
  Home, 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  Upload,
  Grid,
  List,
  Search,
  Filter,
  SortAsc,
  User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import MediaUploader from '@/components/media/MediaUploader';
import MediaGrid from '@/components/media/MediaGrid';
import MediaList from '@/components/media/MediaList';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';

const MediaLibrary = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    mediaItems, 
    isLoading, 
    uploadMedia, 
    deleteMedia, 
    filterMedia 
  } = useMediaLibrary();

  const filteredMedia = filterMedia(searchQuery);
  
  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
            <Link to="/">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <Home className="mr-3 h-5 w-5" />
                Home
              </Button>
            </Link>
            <Link to="/workspace">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Workspace
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              className="w-full justify-start font-medium"
            >
              <ImageIcon className="mr-3 h-5 w-5" />
              Media Library
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-4">
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
          
          <div className="text-lg font-semibold ml-auto mr-auto">Media Library</div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Help
            </Button>
            <Button size="sm">
              Upload Media
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Media Library</h1>
              <p className="text-muted-foreground">
                Upload, organize, and manage your media assets for ad campaigns
              </p>
            </div>
            
            <div className="flex flex-col space-y-6">
              {/* Upload Area */}
              <MediaUploader onUploadComplete={uploadMedia} />
              
              {/* Search and filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex items-center w-full max-w-md">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media files..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="icon"
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Sort Options"
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Filter Options"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Media Browser */}
              <div className="bg-white rounded-lg border border-border shadow-sm">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin mb-4 h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted-foreground">Loading media files...</p>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="p-12 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No media files found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? "Try a different search term or" : "Start by"} uploading your first media file
                    </p>
                    <Button className="mx-auto">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Media
                    </Button>
                  </div>
                ) : (
                  viewMode === 'grid' ? (
                    <MediaGrid items={filteredMedia} onDelete={deleteMedia} />
                  ) : (
                    <MediaList items={filteredMedia} onDelete={deleteMedia} />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
