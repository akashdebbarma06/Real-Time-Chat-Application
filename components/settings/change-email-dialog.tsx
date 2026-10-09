"use client";

import { useState } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: ChangeEmailDialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function reset() {
    setNewEmail("");
    setSent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (currentEmail && trimmed === currentEmail.toLowerCase()) {
      toast.error("New email must be different from your current email");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        email: trimmed,
      });

      if (error) throw error;

      setSent(true);
      toast.success("Confirmation email sent!", {
        description:
          "Please check both your old and new email inboxes to confirm the change.",
        icon: <ShieldCheck className="size-4" />,
        duration: 6000,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            {sent
              ? "We've sent confirmation links to both your old and new email addresses. Click both links to complete the change."
              : "Enter a new email address. You'll need to confirm the change via both your old and new inboxes."}
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Current Email (read-only) */}
            {currentEmail && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Current Email
                </label>
                <div className="rounded-xl border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
                  {currentEmail}
                </div>
              </div>
            )}

            {/* New Email */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                New Email Address
              </label>
              <Input
                required
                type="email"
                placeholder="newemail@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Confirmation
            </Button>
          </form>
        ) : (
          /* Success state */
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
                <Mail className="size-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Confirmation emails sent!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check both <span className="font-medium">{currentEmail}</span>{" "}
                and <span className="font-medium">{newEmail.trim()}</span>
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
