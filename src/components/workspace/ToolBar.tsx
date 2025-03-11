
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus,
  Image,
  Settings,
  Undo,
  Redo,
  Facebook,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ToolBar: React.FC = () => {
  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
    toast(`${action} clicked`, {
      description: 'This functionality will be available in the full version'
    });
  };

  const adAccounts = [
    { id: 1, name: "Main Business Account" },
    { id: 2, name: "Secondary Ad Account" },
    { id: 3, name: "Personal Ad Account" }
  ];

  return (
    <div className="glass-morphism p-2 rounded-lg flex justify-between w-full">
      {/* Left section - Ad Account */}
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1 bg-white bg-opacity-90" onClick={() => handleAction("Select Ad Account")}>
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Ad Account</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-white">
            {adAccounts.map((account) => (
              <DropdownMenuItem key={account.id} onClick={() => handleAction(`Selected ${account.name}`)}>
                {account.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center section - Main actions */}
      <div className="flex space-x-1 items-center">
        <TooltipProvider>
          {/* Creation buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction("Add Campaign")}
                className="px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Campaign
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new Campaign</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction("Add Ad Set")}
                className="px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ad Set
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new Ad Set</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction("Add Ad")}
                className="px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ad
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new Ad</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Media Library */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAction("Media Library")}
                className="h-9 w-9"
              >
                <Image className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Media Library</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAction("Undo")}
                className="h-9 w-9"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAction("Redo")}
                className="h-9 w-9"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Shift+Z)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right section - Settings */}
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAction("Settings")}
                className="h-9 w-9"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ToolBar;
