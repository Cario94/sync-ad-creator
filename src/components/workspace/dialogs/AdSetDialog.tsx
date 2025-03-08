
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { CalendarIcon, Save, Trash, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adSet?: {
    id: string;
    name: string;
    campaignId: string;
    budgetType: string;
    budget: number;
    startDate: Date;
    endDate?: Date;
    ageMin: number;
    ageMax: number;
    gender: string;
    locations: string[];
    placements: string[];
    bidStrategy: string;
    optimizationGoal: string;
  };
  campaigns?: { id: string; name: string }[];
  onSave: (adSet: any) => void;
  onDelete?: () => void;
}

const AdSetDialog: React.FC<AdSetDialogProps> = ({
  open,
  onOpenChange,
  adSet,
  campaigns = [],
  onSave,
  onDelete
}) => {
  const isEditing = !!adSet;
  const [formData, setFormData] = useState({
    name: adSet?.name || '',
    campaignId: adSet?.campaignId || (campaigns.length > 0 ? campaigns[0].id : ''),
    budgetType: adSet?.budgetType || 'campaign',
    budget: adSet?.budget || 20,
    startDate: adSet?.startDate || new Date(),
    endDate: adSet?.endDate,
    ageMin: adSet?.ageMin || 18,
    ageMax: adSet?.ageMax || 65,
    gender: adSet?.gender || 'all',
    locations: adSet?.locations || ['United States'],
    placements: adSet?.placements || [],
    automaticPlacements: adSet?.placements ? adSet.placements.length === 0 : true,
    bidStrategy: adSet?.bidStrategy || 'lowest_cost',
    optimizationGoal: adSet?.optimizationGoal || 'clicks'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const togglePlacement = (placement: string) => {
    setFormData(prev => {
      const newPlacements = [...prev.placements];
      if (newPlacements.includes(placement)) {
        return {
          ...prev,
          placements: newPlacements.filter(p => p !== placement)
        };
      } else {
        return {
          ...prev,
          placements: [...newPlacements, placement]
        };
      }
    });
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Ad Set name is required");
      return;
    }
    
    // If automatic placements is selected, clear the placements array
    const finalData = {
      ...formData,
      placements: formData.automaticPlacements ? [] : formData.placements
    };
    
    onSave({ 
      ...adSet, 
      ...finalData 
    });
    onOpenChange(false);
    toast.success(`Ad Set ${isEditing ? 'updated' : 'created'} successfully`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
      toast.success("Ad Set deleted successfully");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Ad Set' : 'Create Ad Set'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Ad Set Details</TabsTrigger>
            <TabsTrigger value="audience">Audience & Targeting</TabsTrigger>
            <TabsTrigger value="placements">Placements & Delivery</TabsTrigger>
          </TabsList>

          {/* Ad Set Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Set Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter ad set name" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign</Label>
                <Select 
                  value={formData.campaignId} 
                  onValueChange={(value) => handleSelectChange('campaignId', value)}
                  disabled={campaigns.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {campaigns.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No campaigns available. Create a campaign first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetType">Budget Type</Label>
                <Select 
                  value={formData.budgetType} 
                  onValueChange={(value) => handleSelectChange('budgetType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">Use Campaign Budget Optimization</SelectItem>
                    <SelectItem value="adset">Ad Set Level Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.budgetType === 'adset' && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Daily Budget</Label>
                  <Input 
                    id="budget" 
                    name="budget" 
                    type="number" 
                    value={formData.budget} 
                    onChange={handleInputChange} 
                    placeholder="Enter daily budget" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => handleDateChange('startDate', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(formData.endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => handleDateChange('endDate', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Audience & Targeting Tab */}
          <TabsContent value="audience" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Location Targeting</Label>
                <Input 
                  id="locations" 
                  name="locations" 
                  value={formData.locations.join(', ')} 
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    locations: e.target.value.split(',').map(location => location.trim())
                  }))} 
                  placeholder="Enter locations (comma separated)" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ageMin">Minimum Age</Label>
                  <Input 
                    id="ageMin" 
                    name="ageMin" 
                    type="number" 
                    min={13}
                    max={65}
                    value={formData.ageMin} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageMax">Maximum Age</Label>
                  <Input 
                    id="ageMax" 
                    name="ageMax" 
                    type="number" 
                    min={13}
                    max={65}
                    value={formData.ageMax} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup 
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="gender-all" />
                    <Label htmlFor="gender-all">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="gender-male" />
                    <Label htmlFor="gender-male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="gender-female" />
                    <Label htmlFor="gender-female">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailedTargeting">Detailed Targeting</Label>
                <Input 
                  id="detailedTargeting" 
                  placeholder="Interests, behaviors, demographics" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter interests separated by commas (e.g., "fitness, health, yoga")
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Placements & Delivery Tab */}
          <TabsContent value="placements" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="automaticPlacements" 
                  checked={formData.automaticPlacements} 
                  onCheckedChange={(checked) => {
                    handleCheckboxChange('automaticPlacements', checked === true);
                    if (checked) {
                      setFormData(prev => ({ ...prev, placements: [] }));
                    }
                  }}
                />
                <Label htmlFor="automaticPlacements">
                  Automatic Placements (Recommended)
                </Label>
              </div>

              {!formData.automaticPlacements && (
                <div className="space-y-2 border border-border rounded-md p-4">
                  <Label>Manual Placements</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Facebook Feed', 'Instagram Feed', 'Facebook Reels', 'Instagram Reels', 
                      'Facebook Stories', 'Instagram Stories', 'Facebook Right Column', 'Messenger'].map(placement => (
                      <div key={placement} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`placement-${placement}`} 
                          checked={formData.placements.includes(placement)}
                          onCheckedChange={() => togglePlacement(placement)}
                        />
                        <Label htmlFor={`placement-${placement}`}>{placement}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bidStrategy">Bid Strategy</Label>
                <Select 
                  value={formData.bidStrategy} 
                  onValueChange={(value) => handleSelectChange('bidStrategy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bid strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
                    <SelectItem value="cost_cap">Cost Cap</SelectItem>
                    <SelectItem value="bid_cap">Bid Cap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="optimizationGoal">Optimization Goal</Label>
                <Select 
                  value={formData.optimizationGoal} 
                  onValueChange={(value) => handleSelectChange('optimizationGoal', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select optimization goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="impressions">Impressions</SelectItem>
                    <SelectItem value="reach">Reach</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="video_views">Video Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between mt-6">
          <div className="flex space-x-2">
            {isEditing && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdSetDialog;
