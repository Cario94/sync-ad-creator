import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Save, Trash, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog';
import { MediaItem } from '@/hooks/useMediaLibrary';
import type { AdConfig, CallToAction } from '../types/canvas';

interface AdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId?: string;
  adName?: string;
  config: AdConfig;
  adSets?: { id: string; name: string }[];
  onSave: (data: Record<string, unknown> & { name: string }) => void;
  onDelete?: () => void;
}

const AdDialog: React.FC<AdDialogProps> = ({
  open, onOpenChange, adId, adName, config, adSets = [], onSave, onDelete
}) => {
  const isEditing = !!adId;
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const [name, setName] = useState(adName ?? '');
  const [primaryText, setPrimaryText] = useState(config.primaryText);
  const [headline, setHeadline] = useState(config.headline);
  const [description, setDescription] = useState(config.description);
  const [callToAction, setCallToAction] = useState<CallToAction>(config.callToAction);
  const [destinationUrl, setDestinationUrl] = useState(config.destinationUrl);
  const [displayUrl, setDisplayUrl] = useState(config.displayUrl);
  const [imageUrl, setImageUrl] = useState(config.imageUrl);
  const [mediaAssetId, setMediaAssetId] = useState(config.mediaAssetId);
  const [trackingPixel, setTrackingPixel] = useState(config.trackingPixel);
  const [notes, setNotes] = useState(config.notes);
  const [adSetId, setAdSetId] = useState(config.adSetId ?? (adSets[0]?.id ?? ''));

  useEffect(() => {
    if (open) {
      setName(adName ?? '');
      setPrimaryText(config.primaryText);
      setHeadline(config.headline);
      setDescription(config.description);
      setCallToAction(config.callToAction);
      setDestinationUrl(config.destinationUrl);
      setDisplayUrl(config.displayUrl);
      setImageUrl(config.imageUrl);
      setMediaAssetId(config.mediaAssetId);
      setTrackingPixel(config.trackingPixel);
      setNotes(config.notes);
      setAdSetId(config.adSetId ?? (adSets[0]?.id ?? ''));
    }
  }, [open, adId]);

  const handleMediaSelect = (item: MediaItem) => {
    setImageUrl(item.url);
    setMediaAssetId(item.id);
    toast.success(`Selected: ${item.name}`);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Ad name is required"); return; }
    if (!headline.trim()) { toast.error("Headline is required"); return; }
    const data: Record<string, unknown> & { name: string } = {
      name: name.trim(),
      primaryText,
      headline,
      description,
      callToAction,
      destinationUrl,
      displayUrl,
      imageUrl,
      mediaAssetId,
      trackingPixel,
      notes,
      adSetId,
    };
    onSave(data);
    onOpenChange(false);
    toast.success(`Ad ${isEditing ? 'updated' : 'created'}`);
  };

  const handleDelete = () => { onDelete?.(); onOpenChange(false); };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'Edit Ad' : 'Create Ad'}
            </DialogTitle>
            <DialogDescription>Customize your ad details, creative, and tracking.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="creative">Creative & Media</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Ad Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter ad name" />
                </div>
                {adSets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Ad Set</Label>
                    <Select value={adSetId} onValueChange={setAdSetId}>
                      <SelectTrigger><SelectValue placeholder="Select ad set" /></SelectTrigger>
                      <SelectContent>
                        {adSets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Primary Text</Label>
                  <Textarea value={primaryText} onChange={e => setPrimaryText(e.target.value)} placeholder="Main ad text" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Ad headline" />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ad description" />
                </div>
                <div className="space-y-2">
                  <Label>Call to Action</Label>
                  <Select value={callToAction} onValueChange={v => setCallToAction(v as CallToAction)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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

            <TabsContent value="creative" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Image/Video</Label>
                  <div className="border border-dashed border-border rounded-md p-4 text-center">
                    {imageUrl ? (
                      <div className="space-y-4">
                        <div className="aspect-video bg-secondary/30 rounded-md overflow-hidden flex items-center justify-center">
                          <img src={imageUrl} alt="Selected media" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex justify-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setMediaLibraryOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />Change
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setImageUrl(''); setMediaAssetId(''); }}>
                            <X className="mr-2 h-4 w-4" />Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="aspect-video bg-secondary/30 rounded-md flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setMediaLibraryOpen(true)}>
                          <Upload className="mr-2 h-4 w-4" />Select from Media Library
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" rows={2} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} placeholder="https://yourdomain.com/landing" />
                </div>
                <div className="space-y-2">
                  <Label>Display Link (Optional)</Label>
                  <Input value={displayUrl} onChange={e => setDisplayUrl(e.target.value)} placeholder="yourdomain.com" />
                </div>
                <div className="space-y-2">
                  <Label>UTM Preview</Label>
                  <div className="p-3 bg-secondary/30 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground break-all">
                      {`${destinationUrl}${destinationUrl.includes('?') ? '&' : '?'}utm_source=meta&utm_medium=cpc&utm_campaign=${encodeURIComponent(name)}`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tracking Pixel</Label>
                  <Input value={trackingPixel} onChange={e => setTrackingPixel(e.target.value)} placeholder="Pixel ID (optional)" />
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

      <MediaLibraryDialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen} onSelect={handleMediaSelect} />
    </>
  );
};

export default AdDialog;
