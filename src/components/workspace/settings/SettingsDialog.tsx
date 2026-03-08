import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { Loader2, Check, Info } from "lucide-react";
import { toast } from "sonner";
import type { UserPreferences } from "@/types/database";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SaveState = "idle" | "saving" | "saved";

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { preferences, loading, updatePreferences } = useUserSettings();
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const save = useCallback(
    async (partial: Partial<UserPreferences>) => {
      setSaveState("saving");
      try {
        await updatePreferences(partial);
        setSaveState("saved");
        toast.success("Settings saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("idle");
        toast.error("Failed to save settings");
      }
    },
    [updatePreferences]
  );

  const updateNotification = useCallback(
    (key: keyof NonNullable<UserPreferences["notifications"]>, value: boolean) => {
      save({
        notifications: { ...preferences.notifications, [key]: value },
      });
    },
    [save, preferences.notifications]
  );

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
            {saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {saveState === "saved" && <Check className="h-4 w-4 text-emerald-500" />}
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
                checked={preferences.theme === "dark"}
                onCheckedChange={(checked) => save({ theme: checked ? "dark" : "light" })}
              />
            </div>

            {/* Auto save */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Save</Label>
                <p className="text-xs text-muted-foreground">Automatically save workspace changes after 5 seconds of inactivity</p>
              </div>
              <Switch
                checked={preferences.autoSave !== false}
                onCheckedChange={(checked) => save({ autoSave: checked })}
              />
            </div>

            {/* Keyboard shortcuts */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Keyboard Shortcuts</Label>
                <p className="text-xs text-muted-foreground">Enable Ctrl+S to save, Ctrl+Z / Ctrl+Y for undo/redo</p>
              </div>
              <Switch
                checked={preferences.keyboardShortcuts !== false}
                onCheckedChange={(checked) => save({ keyboardShortcuts: checked })}
              />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-5 pt-4">
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" />
              <span>Notification delivery is coming soon. These preferences will be saved for when notifications are available.</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Campaign Reports</Label>
                <p className="text-xs text-muted-foreground">Receive email summaries of campaign performance</p>
              </div>
              <Switch
                checked={preferences.notifications?.emailReports ?? true}
                onCheckedChange={(checked) => updateNotification("emailReports", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Status Changes</Label>
                <p className="text-xs text-muted-foreground">Get notified when campaign status changes</p>
              </div>
              <Switch
                checked={preferences.notifications?.statusChanges ?? false}
                onCheckedChange={(checked) => updateNotification("statusChanges", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Enable browser push notifications</p>
              </div>
              <Switch
                checked={preferences.notifications?.push ?? true}
                onCheckedChange={(checked) => updateNotification("push", checked)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
