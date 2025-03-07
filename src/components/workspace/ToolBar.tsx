
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  LayoutGrid, 
  Image, 
  Upload, 
  Download, 
  Settings, 
  Share, 
  DraftingCompass 
} from 'lucide-react';
import { toast } from 'sonner';

const ToolBar: React.FC = () => {
  const handleAction = (action: string) => {
    toast(`${action} clicked`, {
      description: 'This functionality will be available in the full version'
    });
  };

  const tools = [
    { icon: Plus, label: 'Add Campaign', action: 'Add Campaign' },
    { icon: LayoutGrid, label: 'Add Ad Set', action: 'Add Ad Set' },
    { icon: Image, label: 'Add Ad', action: 'Add Ad' },
    { icon: DraftingCompass, label: 'Tidy Layout', action: 'Tidy Layout' },
    { icon: Upload, label: 'Upload to Meta', action: 'Upload to Meta' },
    { icon: Download, label: 'Export', action: 'Export' },
    { icon: Share, label: 'Share', action: 'Share' },
    { icon: Settings, label: 'Settings', action: 'Settings' }
  ];

  return (
    <div className="glass-morphism p-2 rounded-lg flex flex-wrap justify-center space-x-1">
      <TooltipProvider>
        {tools.map((tool, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAction(tool.action)}
                className="h-10 w-10"
              >
                <tool.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ToolBar;
