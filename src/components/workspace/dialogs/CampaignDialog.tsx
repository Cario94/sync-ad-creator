
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
import { format } from 'date-fns';
import { CalendarIcon, Save, Trash, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: {
    id: string;
    name: string;
    objective: string;
    budget: number;
    specialAdCategory: boolean;
    campaignSpendingLimit?: number;
    abTesting: boolean;
    buyingType: string;
    budgetOptimization: boolean;
    bidStrategy: string;
    startDate?: Date;
    endDate?: Date;
    adStrategyType: string;
    placementStrategy: boolean;
  };
  onSave: (campaign: any) => void;
  onDelete?: () => void;
}

const CampaignDialog: React.FC<CampaignDialogProps> = ({
  open,
  onOpenChange,
  campaign,
  onSave,
  onDelete
}) => {
  const isEditing = !!campaign;
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    objective: campaign?.objective || 'awareness',
    budget: campaign?.budget || 50,
    specialAdCategory: campaign?.specialAdCategory || false,
    campaignSpendingLimit: campaign?.campaignSpendingLimit || '',
    abTesting: campaign?.abTesting || false,
    buyingType: campaign?.buyingType || 'auction',
    budgetOptimization: campaign?.budgetOptimization || true,
    bidStrategy: campaign?.bidStrategy || 'lowest_cost',
    startDate: campaign?.startDate || new Date(),
    endDate: campaign?.endDate || undefined,
    adStrategyType: campaign?.adStrategyType || 'standard',
    placementStrategy: campaign?.placementStrategy || true,
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

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Campaign name is required");
      return;
    }
    
    onSave({ 
      ...campaign, 
      ...formData 
    });
    onOpenChange(false);
    toast.success(`Campaign ${isEditing ? 'updated' : 'created'} successfully`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
      toast.success("Campaign deleted successfully");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Campaign' : 'Create Campaign'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="targeting">Targeting & Budget</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          {/* Campaign Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter campaign name" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Select 
                  value={formData.objective} 
                  onValueChange={(value) => handleSelectChange('objective', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">Awareness</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="app_promotion">App Promotion</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="specialAdCategory" 
                  checked={formData.specialAdCategory} 
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('specialAdCategory', checked === true)}
                />
                <Label htmlFor="specialAdCategory">
                  Special Ad Category (Credit, Housing, Employment)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignSpendingLimit">Campaign Spending Limit (Optional)</Label>
                <Input 
                  id="campaignSpendingLimit" 
                  name="campaignSpendingLimit" 
                  type="number" 
                  value={formData.campaignSpendingLimit} 
                  onChange={handleInputChange} 
                  placeholder="Enter spending limit" 
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="abTesting" 
                  checked={formData.abTesting} 
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('abTesting', checked === true)}
                />
                <Label htmlFor="abTesting">Enable A/B Testing</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyingType">Buying Type</Label>
                <Select 
                  value={formData.buyingType} 
                  onValueChange={(value) => handleSelectChange('buyingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select buying type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auction">Auction (Default)</SelectItem>
                    <SelectItem value="reach_frequency">Reach & Frequency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Targeting & Budget Tab */}
          <TabsContent value="targeting" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="budgetOptimization" 
                  checked={formData.budgetOptimization} 
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('budgetOptimization', checked === true)}
                />
                <Label htmlFor="budgetOptimization">Campaign Budget Optimization</Label>
              </div>

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

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="adStrategyType">Ad Strategy Type</Label>
                <Select 
                  value={formData.adStrategyType} 
                  onValueChange={(value) => handleSelectChange('adStrategyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="advantage_plus">Advantage+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="placementStrategy" 
                  checked={formData.placementStrategy} 
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('placementStrategy', checked === true)}
                />
                <Label htmlFor="placementStrategy">
                  Auto Placement (Recommended)
                </Label>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <Label>Campaign ID</Label>
                  <div className="p-2 bg-secondary/30 rounded-md border border-border text-muted-foreground">
                    {campaign.id}
                  </div>
                </div>
              )}
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

export default CampaignDialog;
