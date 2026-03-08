import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Save, Trash, X } from 'lucide-react';
import { toast } from 'sonner';
import { toDateString, fromDateString } from '@/lib/dateUtils';
import type { CampaignConfig, CampaignObjective, BidStrategy, BuyingType, BudgetType } from '../types/canvas';

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string;
  campaignName?: string;
  config: CampaignConfig;
  onSave: (data: Record<string, unknown> & { name: string }) => void;
  onDelete?: () => void;
}

const CampaignDialog: React.FC<CampaignDialogProps> = ({
  open, onOpenChange, campaignId, campaignName, config, onSave, onDelete
}) => {
  const isEditing = !!campaignId;

  const [name, setName] = useState(campaignName ?? '');
  const [objective, setObjective] = useState<CampaignObjective>(config.objective);
  const [budgetType, setBudgetType] = useState<BudgetType>(config.budgetType);
  const [budget, setBudget] = useState(config.budget);
  const [bidStrategy, setBidStrategy] = useState<BidStrategy>(config.bidStrategy);
  const [buyingType, setBuyingType] = useState<BuyingType>(config.buyingType);
  const [specialAdCategory, setSpecialAdCategory] = useState(config.specialAdCategory);
  const [startDate, setStartDate] = useState<Date | undefined>(fromDateString(config.startDate));
  const [endDate, setEndDate] = useState<Date | undefined>(fromDateString(config.endDate));
  const [notes, setNotes] = useState(config.notes);

  useEffect(() => {
    if (open) {
      setName(campaignName ?? '');
      setObjective(config.objective);
      setBudgetType(config.budgetType);
      setBudget(config.budget);
      setBidStrategy(config.bidStrategy);
      setBuyingType(config.buyingType);
      setSpecialAdCategory(config.specialAdCategory);
      setStartDate(fromDateString(config.startDate));
      setEndDate(fromDateString(config.endDate));
      setNotes(config.notes);
    }
  }, [open, campaignId]);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Campaign name is required"); return; }
    const data: Record<string, unknown> & { name: string } = {
      name: name.trim(),
      objective,
      status: config.status,
      budgetType,
      budget,
      bidStrategy,
      buyingType,
      specialAdCategory,
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      notes,
      // preserve legacy fields
      budgetOptimization: config.budgetOptimization,
      adStrategyType: config.adStrategyType,
      placementStrategy: config.placementStrategy,
      campaignSpendingLimit: config.campaignSpendingLimit,
      abTesting: config.abTesting,
    };
    onSave(data);
    onOpenChange(false);
    toast.success(`Campaign ${isEditing ? 'updated' : 'created'}`);
  };

  const handleDelete = () => {
    onDelete?.();
    onOpenChange(false);
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
            <TabsTrigger value="budget">Budget & Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter campaign name" />
              </div>
              <div className="space-y-2">
                <Label>Objective</Label>
                <Select value={objective} onValueChange={v => setObjective(v as CampaignObjective)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="space-y-2">
                <Label>Buying Type</Label>
                <Select value={buyingType} onValueChange={v => setBuyingType(v as BuyingType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auction">Auction</SelectItem>
                    <SelectItem value="reach_frequency">Reach & Frequency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="specialAdCategory" checked={specialAdCategory} onCheckedChange={c => setSpecialAdCategory(c === true)} />
                <Label htmlFor="specialAdCategory">Special Ad Category</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Budget Type</Label>
                <Select value={budgetType} onValueChange={v => setBudgetType(v as BudgetType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Budget</SelectItem>
                    <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Bid Strategy</Label>
                <Select value={bidStrategy} onValueChange={v => setBidStrategy(v as BidStrategy)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" rows={3} />
              </div>
              {campaignId && (
                <div className="space-y-2">
                  <Label>Campaign ID</Label>
                  <div className="p-2 bg-secondary/30 rounded-md border border-border text-muted-foreground text-xs">{campaignId}</div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between mt-6">
          <div className="flex space-x-2">
            {isEditing && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />Delete
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
