import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { profilesService } from "@/services/profiles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, Mail } from "lucide-react";
import { toast } from "sonner";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const email = user?.email || "";
  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : email ? email[0].toUpperCase() : "U";

  // Load profile from DB
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    setDirty(false);
    profilesService.get(user.id)
      .then(profile => {
        if (!cancelled) {
          setFullName(profile?.full_name || user.user_metadata?.full_name || "");
        }
      })
      .catch(() => {
        if (!cancelled) setFullName(user.user_metadata?.full_name || "");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, user]);

  const handleSave = async () => {
    if (!user || !dirty) return;
    setSaving(true);
    try {
      await profilesService.update(user.id, { full_name: fullName.trim() || null });
      // Also update auth metadata so it's reflected immediately in the session
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      toast.success("Profile updated");
      setDirty(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent", {
        description: "Check your inbox for the reset link.",
      });
    } catch {
      toast.error("Failed to send reset email");
    }
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identity display */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-lg truncate">{fullName || "User"}</h3>
                <p className="text-muted-foreground text-sm truncate">{email}</p>
                {createdAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">Member since {createdAt}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Editable name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Display Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setDirty(true); }}
                placeholder="Your name"
              />
              <p className="text-xs text-muted-foreground">This is how your name appears across the app.</p>
            </div>

            {/* Read-only email */}
            <div className="space-y-2">
              <Label htmlFor="profileEmail">Email</Label>
              <div className="flex items-center gap-2">
                <Input id="profileEmail" type="email" value={email} disabled className="flex-1" />
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>

            <Separator />

            {/* Password section — honest flow */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <p className="text-xs text-muted-foreground">
                To change your password, we'll send a secure reset link to your email.
              </p>
              <Button variant="outline" size="sm" onClick={handlePasswordReset}>
                Send Password Reset Email
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {dirty ? "Cancel" : "Close"}
              </Button>
              <Button onClick={handleSave} disabled={!dirty || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
