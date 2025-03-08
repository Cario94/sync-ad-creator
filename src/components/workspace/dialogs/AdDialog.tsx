
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Image, Save, Trash, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog';
import { MediaItem } from '@/hooks/useMediaLibrary';

interface AdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad?: {
    id: string;
    name: string;
    adSetId: string;
    primaryText: string;
    headline: string;
    description: string;
    callToAction: string;
    imageUrl?: string;
    destinationUrl: string;
    displayUrl: string;
    trackingPixel?: string;
    conversionEvent?: string;
  };
  adSets?: { id: string; name: string }[];
  onSave: (ad: any) => void;
  onDelete?: () => void;
}

const AdDialog: React.FC<AdDialogProps> = ({
  open,
  onOpenChange,
  ad,
  adSets = [],
  onSave,
  onDelete
}) => {
  const isEditing = !!ad;
  const [formData, setFormData] = useState({
    name: ad?.name || '',
    adSetId: ad?.adSetId || (adSets.length > 0 ? adSets[0].id : ''),
    primaryText: ad?.primaryText || '',
    headline: ad?.headline || '',
    description: ad?.description || '',
    callToAction: ad?.callToAction || 'learn_more',
    imageUrl: ad?.imageUrl || '',
    destinationUrl: ad?.destinationUrl || 'https://',
    displayUrl: ad?.displayUrl || '',
    perPlacementCreative: false,
    trackingPixel: ad?.trackingPixel || '',
    conversionEvent: ad?.conversionEvent || 'purchase'
  });
  
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleMediaSelect = (item: MediaItem) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: item.url
    }));
    toast.success(`Selected: ${item.name}`);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Ad name is required");
      return;
    }
    
    if (!formData.headline) {
      toast.error("Headline is required");
      return;
    }
    
    onSave({ 
      ...ad, 
      ...formData 
    });
    onOpenChange(false);
    toast.success(`Ad ${isEditing ? 'updated' : 'created'} successfully`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
      toast.success("Ad deleted successfully");
    }
  };

  const showPreview = () => {
    toast("Ad Preview", {
      description: "This functionality will be available in the full version"
    });
  };
  
  const handleImageUpload = () => {
    setMediaLibraryOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'Edit Ad' : 'Create Ad'}
            </DialogTitle>
            <DialogDescription>
              Customize your ad details, creative elements, and tracking settings.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Ad Details</TabsTrigger>
              <TabsTrigger value="creative">Creative & Media</TabsTrigger>
              <TabsTrigger value="tracking">Tracking & Settings</TabsTrigger>
            </TabsList>

            {/* Ad Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter ad name" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adSetId">Ad Set</Label>
                  <Select 
                    value={formData.adSetId} 
                    onValueChange={(value) => handleSelectChange('adSetId', value)}
                    disabled={adSets.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad set" />
                    </SelectTrigger>
                    <SelectContent>
                      {adSets.map(adSet => (
                        <SelectItem key={adSet.id} value={adSet.id}>
                          {adSet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {adSets.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No ad sets available. Create an ad set first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryText">Primary Text</Label>
                  <Textarea 
                    id="primaryText" 
                    name="primaryText" 
                    value={formData.primaryText} 
                    onChange={handleInputChange} 
                    placeholder="Enter the main text for your ad" 
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input 
                    id="headline" 
                    name="headline" 
                    value={formData.headline} 
                    onChange={handleInputChange} 
                    placeholder="Enter ad headline" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Enter ad description" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callToAction">Call to Action</Label>
                  <Select 
                    value={formData.callToAction} 
                    onValueChange={(value) => handleSelectChange('callToAction', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select call to action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learn_more">Learn More</SelectItem>
                      <SelectItem value="shop_now">Shop Now</SelectItem>
                      <SelectItem value="sign_up">Sign Up</SelectItem>
                      <SelectItem value="book_now">Book Now</SelectItem>
                      <SelectItem value="contact_us">Contact Us</SelectItem>
                      <SelectItem value="download">Download</SelectItem>
                      <SelectItem value="apply_now">Apply Now</SelectItem>
                      <SelectItem value="get_offer">Get Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Creative & Media Tab */}
            <TabsContent value="creative" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Image/Video</Label>
                  <div className="border border-dashed border-border rounded-md p-4 text-center">
                    {formData.imageUrl ? (
                      <div className="space-y-4">
                        <div className="aspect-video bg-secondary/30 rounded-md overflow-hidden flex items-center justify-center">
                          <img 
                            src={formData.imageUrl} 
                            alt="Selected media" 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Media selected</p>
                        <div className="flex justify-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleImageUpload}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Change Media
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="aspect-video bg-secondary/30 rounded-md flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No media selected</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleImageUpload}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Select from Media Library
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="perPlacementCreative" 
                    checked={formData.perPlacementCreative} 
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('perPlacementCreative', checked === true)}
                  />
                  <Label htmlFor="perPlacementCreative">
                    Enable different creatives per placement
                  </Label>
                </div>

                <div>
                  <Button variant="outline" type="button" onClick={showPreview}>
                    Preview Ads in All Placements
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tracking & Settings Tab */}
            <TabsContent value="tracking" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destinationUrl">Website URL</Label>
                  <Input 
                    id="destinationUrl" 
                    name="destinationUrl" 
                    value={formData.destinationUrl} 
                    onChange={handleInputChange} 
                    placeholder="https://yourdomain.com/landing-page" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayUrl">Display Link (Optional)</Label>
                  <Input 
                    id="displayUrl" 
                    name="displayUrl" 
                    value={formData.displayUrl} 
                    onChange={handleInputChange} 
                    placeholder="yourdomain.com" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>UTM Parameters</Label>
                  <div className="p-3 bg-secondary/30 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground">
                      {`${formData.destinationUrl}${formData.destinationUrl.includes('?') ? '&' : '?'}utm_source=meta&utm_medium=cpc&utm_campaign=${encodeURIComponent(formData.name || '')}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackingPixel">Pixel Tracking</Label>
                  <Select 
                    value={formData.trackingPixel} 
                    onValueChange={(value) => handleSelectChange('trackingPixel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pixel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="pixel_1">Meta Pixel (1234567890)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversionEvent">Conversion Event</Label>
                  <Select 
                    value={formData.conversionEvent} 
                    onValueChange={(value) => handleSelectChange('conversionEvent', value)}
                    disabled={!formData.trackingPixel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select conversion event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="complete_registration">Complete Registration</SelectItem>
                      <SelectItem value="add_to_cart">Add to Cart</SelectItem>
                      <SelectItem value="view_content">View Content</SelectItem>
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
      
      {/* Media Library Dialog */}
      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleMediaSelect}
      />
    </>
  );
};

export default AdDialog;
