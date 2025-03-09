
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dark Mode</span>
                <Switch id="theme" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoSave">Auto Save</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Save changes automatically</span>
                <Switch id="autoSave" defaultChecked />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyboard-shortcuts">Keyboard Shortcuts</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable keyboard shortcuts</span>
                <Switch id="keyboard-shortcuts" defaultChecked />
              </div>
            </div>
            <Button className="w-full">Save Changes</Button>
          </TabsContent>
          <TabsContent value="integrations" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="meta-api">Meta API Connection</Label>
              <Input id="meta-api" placeholder="Meta API Key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-api">Google Ads API Connection</Label>
              <Input id="google-api" placeholder="Google Ads API Key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin-api">LinkedIn API Connection</Label>
              <Input id="linkedin-api" placeholder="LinkedIn API Key" />
            </div>
            <Button className="w-full">Connect Accounts</Button>
          </TabsContent>
          <TabsContent value="notifications" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Email Notifications</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Campaign reports</span>
                <Switch id="email-reports" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Campaign status changes</span>
                <Switch id="email-status" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Team comments</span>
                <Switch id="email-comments" defaultChecked />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Push Notifications</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable push notifications</span>
                <Switch id="push" defaultChecked />
              </div>
            </div>
            <Button className="w-full">Save Preferences</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
