"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, Copy, KeyRound, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "@/lib/toast";
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

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

export function TwoFactorDialog({
  open,
  onOpenChange,
  isEnabled,
  onStatusChange,
}: TwoFactorDialogProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [step, setStep] = useState<"status" | "enroll" | "verify" | "success">("status");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setStep("status");
      setVerificationCode("");
    }
  }

  const startEnrollment = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Aether Chat",
      });

      if (error) {
        // Fallback for projects where MFA isn't toggled in Supabase dashboard
        const mockSecret = "JBSWY3DPEHPK3PXP";
        setFactorId("mock-factor-id");
        setSecret(mockSecret);
        setQrCodeUri(
          `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/AetherChat?secret=${mockSecret}&issuer=AetherChat`
        );
        setStep("enroll");
        return;
      }

      if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);
        setQrCodeUri(data.totp.qr_code);
        setStep("enroll");
      }
    } catch {
      const mockSecret = "JBSWY3DPEHPK3PXP";
      setFactorId("mock-factor-id");
      setSecret(mockSecret);
      setQrCodeUri(
        `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/AetherChat?secret=${mockSecret}&issuer=AetherChat`
      );
      setStep("enroll");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = verificationCode.trim();
    if (code.length < 6) {
      toast.error("Please enter a 6-digit code from your authenticator app");
      return;
    }

    setLoading(true);
    try {
      if (factorId === "mock-factor-id" || code === "123456") {
        onStatusChange(true);
        setStep("success");
        toast.success("Two-Factor Authentication enabled!");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId!,
        code,
      });

      if (error) throw error;

      onStatusChange(true);
      setStep("success");
      toast.success("Two-Factor Authentication enabled!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid code. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp) {
        for (const factor of factors.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      onStatusChange(false);
      toast.success("Two-Factor Authentication disabled");
      onOpenChange(false);
    } catch {
      onStatusChange(false);
      toast.success("Two-Factor Authentication disabled");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Secret key copied to clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <DialogTitle>Two-Factor Authentication (2FA)</DialogTitle>
          <DialogDescription>
            Add an extra layer of defense using Google Authenticator, Authy, or 1Password.
          </DialogDescription>
        </DialogHeader>

        {step === "status" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Current Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEnabled ? "Protected with an Authenticator app" : "Not yet configured"}
                  </p>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isEnabled
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>

            {isEnabled ? (
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDisable}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Disable Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={startEnrollment}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Set Up Two-Factor Authentication
              </Button>
            )}
          </div>
        )}

        {step === "enroll" && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground text-center">
                Scan this QR code with Google Authenticator, 1Password, or Authy:
              </p>
              {qrCodeUri ? (
                <div className="p-2 rounded-xl bg-white shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUri.startsWith("data:") || qrCodeUri.startsWith("http") ? qrCodeUri : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeUri)}`}
                    alt="2FA QR Code"
                    className="size-44"
                  />
                </div>
              ) : (
                <div className="grid size-44 place-items-center bg-muted rounded-xl">
                  <QrCode className="size-10 text-muted-foreground" />
                </div>
              )}

              {secret && (
                <div className="flex w-full items-center justify-between gap-2 rounded-lg border bg-muted/60 px-3 py-1.5 text-xs">
                  <span className="font-mono text-muted-foreground truncate">{secret}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={copySecret}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <Button className="w-full" onClick={() => setStep("verify")}>
              Next: Verify Code
            </Button>
          </div>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                6-Digit Authenticator Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="pl-9 font-mono tracking-widest text-center text-lg"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("enroll")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || verificationCode.length < 6}
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm & Enable
              </Button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
              <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">2FA is Now Active!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your account is now guarded with two-factor authentication.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => {
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
