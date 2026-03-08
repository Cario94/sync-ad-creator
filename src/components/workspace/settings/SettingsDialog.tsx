import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { userSettingsService } from "@/services/userSettings";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/types/database";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Load settings when dialog opens
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    userSettingsService.get(user.id).then(data => {
      if (!cancelled) { setPrefs(data); setLoading(false); }
    }).catch(() => {
      if (!cancelled) { setPrefs(DEFAULT_PREFERENCES); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [open, user]);

  const save = useCallback(async (updated: UserPreferences) => {
    if (!user) return;
    setSaveState('saving');
    try {
      await userSettingsService.update(user.id, updated);
      setSaveState('saved');
      toast.success('Settings saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
      toast.error('Failed to save settings');
    }
  }, [user]);

  const update = useCallback((partial: Partial<UserPreferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, [save]);

  const updateNotification = useCallback((key: keyof NonNullable<UserPreferences['notifications']>, value: boolean) => {
    setPrefs(prev => {
      const next = {
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      };
      save(next);
      return next;
    });
  }, [save]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Settings
            {saveState === 'saving' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {saveState === 'saved' && <Check className="h-4 w-4 text-emerald-500" />}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-5 pt-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark appearance</p>
              </div>
              <Switch
                checked={prefs.theme === 'dark'}
                onCheckedChange={(checked) => update({ theme: checked ? 'dark' : 'light' })}
              />
            </div>

            {/* Default workspace view */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Default Workspace View</Label>
                <p className="text-xs text-muted-foreground">How to display projects on open</p>
              </div>
              <Select
                value={prefs.defaultWorkspaceView ?? 'canvas'}
                onValueChange={(v) => update({ defaultWorkspaceView: v as UserPreferences['defaultWorkspaceView'] })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canvas">Canvas</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto save */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Save</Label>
                <p className="text-xs text-muted-foreground">Save changes automatically while editing</p>
              </div>
              <Switch
                checked={prefs.autoSave ?? true}
                onCheckedChange={(checked) => update({ autoSave: checked })}
              />
            </div>

            {/* Keyboard shortcuts */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Keyboard Shortcuts</Label>
                <p className="text-xs text-muted-foreground">Enable Ctrl+Z, Ctrl+S, and other shortcuts</p>
              </div>
              <Switch
                checked={prefs.keyboardShortcuts ?? true}
                onCheckedChange={(checked) => update({ keyboardShortcuts: checked })}
              />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Campaign Reports</Label>
                <p className="text-xs text-muted-foreground">Receive email summaries of campaign performance</p>
              </div>
              <Switch
                checked={prefs.notifications?.emailReports ?? true}
                onCheckedChange={(checked) => updateNotification('emailReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Status Changes</Label>
                <p className="text-xs text-muted-foreground">Get notified when campaign status changes</p>
              </div>
              <Switch
                checked={prefs.notifications?.statusChanges ?? false}
                onCheckedChange={(checked) => updateNotification('statusChanges', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Enable browser push notifications</p>
              </div>
              <Switch
                checked={prefs.notifications?.push ?? true}
                onCheckedChange={(checked) => updateNotification('push', checked)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
