import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || '';
  const email = user?.email || '';
  const nameParts = fullName.split(' ');
  const initials = fullName
    ? nameParts.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email ? email[0].toUpperCase() : 'U';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-medium text-lg">{fullName || 'User'}</h3>
              <p className="text-muted-foreground text-sm">{email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={nameParts[0] || ''} placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={nameParts.slice(1).join(' ') || ''} placeholder="Last name" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Your company" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="Your role" />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" placeholder="Enter current password" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" placeholder="New password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
