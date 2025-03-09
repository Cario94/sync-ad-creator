
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { CanvasElement } from './CanvasElements';

interface MultiSelectSettingsProps {
  count: number;
  onClose: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  elementTypes: ('campaign' | 'adset' | 'ad')[];
}

const MultiSelectSettings: React.FC<MultiSelectSettingsProps> = ({
  count,
  onClose,
  onUpdate,
  elementTypes
}) => {
  // Check if all selected elements are of the same type
  const allSameType = elementTypes.every(type => type === elementTypes[0]);
  const elementType = allSameType ? elementTypes[0] : 'mixed';
  
  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newName = formData.get('name') as string;
    
    if (newName) {
      onUpdate({ name: newName });
      form.reset();
    }
  };
  
  return (
    <Card className="absolute top-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">
            {count} {elementType !== 'mixed' ? elementType + 's' : 'items'} selected
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <form onSubmit={handleRename} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="name" className="sr-only">Rename</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Rename all selected items" 
                className="w-full" 
              />
            </div>
            <Button type="submit" size="sm">Rename</Button>
          </form>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Bulk Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdate({ position: { x: 100, y: 100 } })}
            >
              Align Left
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdate({ position: { x: 400, y: 100 } })}
            >
              Align Center
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                /* Implementation would depend on your layout needs */
                onUpdate({});
              }}
            >
              Distribute
            </Button>
          </div>
        </div>
        
        {elementType === 'campaign' && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Campaign Settings</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Set Active</Button>
              <Button variant="outline" size="sm">Set Paused</Button>
            </div>
          </div>
        )}
        
        {elementType === 'adset' && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ad Set Settings</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Set Budget</Button>
              <Button variant="outline" size="sm">Set Schedule</Button>
            </div>
          </div>
        )}
        
        {elementType === 'ad' && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ad Settings</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Set CTA</Button>
              <Button variant="outline" size="sm">Set Image</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiSelectSettings;
