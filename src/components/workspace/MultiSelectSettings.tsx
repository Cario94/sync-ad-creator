import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { CanvasElement } from './types/canvas';

interface MultiSelectSettingsProps {
  count: number;
  onClose: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onUpdateIndividual: (elementId: string, updates: Partial<CanvasElement>) => void;
  elementTypes: ('campaign' | 'adset' | 'ad')[];
  selectedElements: CanvasElement[];
}

const MultiSelectSettings: React.FC<MultiSelectSettingsProps> = ({
  count,
  onClose,
  onUpdate,
  onUpdateIndividual,
  elementTypes,
  selectedElements
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

  const handleAlignLeft = () => {
    const leftmostX = Math.min(...selectedElements.map(el => el.position.x));
    selectedElements.forEach(element => {
      onUpdateIndividual(element.id, { 
        position: { x: leftmostX, y: element.position.y } 
      });
    });
  };

  const handleAlignCenter = () => {
    const positions = selectedElements.map(el => el.position.x);
    const centerX = (Math.min(...positions) + Math.max(...positions)) / 2;
    selectedElements.forEach(element => {
      onUpdateIndividual(element.id, { 
        position: { x: centerX, y: element.position.y } 
      });
    });
  };

  const handleDistribute = () => {
    if (selectedElements.length < 3) return;
    
    const sortedElements = [...selectedElements].sort((a, b) => a.position.x - b.position.x);
    const leftmost = sortedElements[0].position.x;
    const rightmost = sortedElements[sortedElements.length - 1].position.x;
    const spacing = (rightmost - leftmost) / (sortedElements.length - 1);
    
    sortedElements.forEach((element, index) => {
      if (index > 0 && index < sortedElements.length - 1) {
        onUpdateIndividual(element.id, {
          position: { x: leftmost + spacing * index, y: element.position.y }
        });
      }
    });
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
              onClick={handleAlignLeft}
            >
              Align Left
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAlignCenter}
            >
              Align Center
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDistribute}
              disabled={selectedElements.length < 3}
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
