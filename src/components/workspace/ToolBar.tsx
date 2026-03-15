
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus,
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

interface ToolBarProps {
  onAddCampaign?: () => void;
  onAddAdSet?: () => void;
  onAddAd?: () => void;
}

const ToolBar: React.FC<ToolBarProps> = ({ onAddCampaign, onAddAdSet, onAddAd }) => {
  const handleAction = (action: string) => {
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
    <div className="glass-morphism p-2 rounded-lg flex items-center justify-between w-full gap-3">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={onAddCampaign} className="px-3">
                <Plus className="h-4 w-4 mr-1" />
                Campaign
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Add new Campaign</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={onAddAdSet} className="px-3">
                <Plus className="h-4 w-4 mr-1" />
                Ad Set
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Add new Ad Set</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={onAddAd} className="px-3">
                <Plus className="h-4 w-4 mr-1" />
                Ad
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Add new Ad</p></TooltipContent>
          </Tooltip>

        </TooltipProvider>
      </div>

    </div>
  );
};

export default ToolBar;
