
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Canvas from '@/components/workspace/Canvas';
import ToolBar from '@/components/workspace/ToolBar';
import { 
  Menu, 
  X, 
  Home, 
  LayoutDashboard, 
  Image, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Workspace = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/');
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
            >
              <Image className="mr-3 h-5 w-5" />
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
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>
      </div>
    </div>
  );
};

export default Workspace;
