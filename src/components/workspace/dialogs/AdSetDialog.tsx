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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { CalendarIcon, Save, Trash, X } from 'lucide-react';
import { toast } from 'sonner';
import { toDateString, fromDateString } from '@/lib/dateUtils';
import type { AdSetConfig, BudgetType, BidStrategy, OptimizationGoal, Gender } from '../types/canvas';

interface AdSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adSetId?: string;
  adSetName?: string;
  config: AdSetConfig;
  campaigns?: { id: string; name: string }[];
  onSave: (data: Record<string, unknown> & { name: string }) => void;
  onDelete?: () => void;
}

const AdSetDialog: React.FC<AdSetDialogProps> = ({
  open, onOpenChange, adSetId, adSetName, config, campaigns = [], onSave, onDelete
}) => {
  const isEditing = !!adSetId;

  const [name, setName] = useState(adSetName ?? '');
  const [budgetType, setBudgetType] = useState<BudgetType>(config.budgetType);
  const [budget, setBudget] = useState(config.budget);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>(config.optimizationGoal);
  const [bidStrategy, setBidStrategy] = useState<BidStrategy>(config.bidStrategy);
  const [placements, setPlacements] = useState<string[]>(config.placements);
  const [automaticPlacements, setAutomaticPlacements] = useState(config.placements.length === 0);
  const [locations, setLocations] = useState<string[]>(config.locations);
  const [ageMin, setAgeMin] = useState(config.ageMin);
  const [ageMax, setAgeMax] = useState(config.ageMax);
  const [gender, setGender] = useState<Gender>(config.gender);
  const [startDate, setStartDate] = useState<Date | undefined>(fromDateString(config.startDate));
  const [endDate, setEndDate] = useState<Date | undefined>(fromDateString(config.endDate));
  const [notes, setNotes] = useState(config.notes);
  const [campaignId, setCampaignId] = useState(config.campaignId ?? (campaigns[0]?.id ?? ''));

  useEffect(() => {
    if (open) {
      setName(adSetName ?? '');
      setBudgetType(config.budgetType);
      setBudget(config.budget);
      setOptimizationGoal(config.optimizationGoal);
      setBidStrategy(config.bidStrategy);
      setPlacements(config.placements);
      setAutomaticPlacements(config.placements.length === 0);
      setLocations(config.locations);
      setAgeMin(config.ageMin);
      setAgeMax(config.ageMax);
      setGender(config.gender);
      setStartDate(fromDateString(config.startDate));
      setEndDate(fromDateString(config.endDate));
      setNotes(config.notes);
      setCampaignId(config.campaignId ?? (campaigns[0]?.id ?? ''));
    }
  }, [open, adSetId]);

  const togglePlacement = (p: string) => {
    setPlacements(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Ad Set name is required"); return; }
    const data: Record<string, unknown> & { name: string } = {
      name: name.trim(),
      budgetType,
      budget,
      optimizationGoal,
      bidStrategy,
      placements: automaticPlacements ? [] : placements,
      locations,
      ageMin,
      ageMax,
      gender,
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      notes,
      campaignId,
    };
    onSave(data);
    onOpenChange(false);
    toast.success(`Ad Set ${isEditing ? 'updated' : 'created'}`);
  };

  const handleDelete = () => { onDelete?.(); onOpenChange(false); };

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
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="placements">Placements & Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Ad Set Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter ad set name" />
              </div>
              {campaigns.length > 0 && (
                <div className="space-y-2">
                  <Label>Campaign</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                    <SelectContent>
                      {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

          <TabsContent value="audience" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Location Targeting</Label>
                <Input value={locations.join(', ')} onChange={e => setLocations(e.target.value.split(',').map(l => l.trim()).filter(Boolean))} placeholder="Locations (comma separated)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Age</Label>
                  <Input type="number" min={13} max={65} value={ageMin} onChange={e => setAgeMin(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Age</Label>
                  <Input type="number" min={13} max={65} value={ageMax} onChange={e => setAgeMax(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup value={gender} onValueChange={v => setGender(v as Gender)} className="flex space-x-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="g-all" /><Label htmlFor="g-all">All</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="g-m" /><Label htmlFor="g-m">Male</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="g-f" /><Label htmlFor="g-f">Female</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" rows={2} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="placements" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="autoPlacements" checked={automaticPlacements} onCheckedChange={c => {
                  setAutomaticPlacements(c === true);
                  if (c) setPlacements([]);
                }} />
                <Label htmlFor="autoPlacements">Automatic Placements (Recommended)</Label>
              </div>
              {!automaticPlacements && (
                <div className="border border-border rounded-md p-4">
                  <Label>Manual Placements</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Facebook Feed','Instagram Feed','Facebook Reels','Instagram Reels','Facebook Stories','Instagram Stories','Facebook Right Column','Messenger'].map(p => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox id={`pl-${p}`} checked={placements.includes(p)} onCheckedChange={() => togglePlacement(p)} />
                        <Label htmlFor={`pl-${p}`}>{p}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <div className="space-y-2">
                <Label>Optimization Goal</Label>
                <Select value={optimizationGoal} onValueChange={v => setOptimizationGoal(v as OptimizationGoal)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

export default AdSetDialog;
