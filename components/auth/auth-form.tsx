"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, MessageCircleMore, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to ChatSphere");
        router.replace(searchParams.get("next") || "/chat");
        router.refresh();
      } else {
        const origin = window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: { display_name: displayName.trim(), username: username.trim() },
          },
        });
        if (error) throw error;

        if (data.session) {
          toast.success("Your ChatSphere account is ready");
          router.replace("/chat");
          router.refresh();
        } else {
          // Verification Code / Confirmation required
          setIsVerifying(true);
          toast.success(`Verification code sent to ${email}`);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "Authentication failed";
      toast.error(message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpCode.trim()) return toast.error("Please enter the verification code");

    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "signup",
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Email verified! Welcome to ChatSphere");
        router.replace("/chat");
        router.refresh();
      } else {
        toast.success("Email verified successfully! Please log in.");
        setIsVerifying(false);
        router.replace("/login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid verification code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification code resent to your email");
    }
  }

  async function handleSocialAuth(provider: "google" | "github") {
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  // --------------------------------------------------------------------------
  // OTP Verification View
  // --------------------------------------------------------------------------
  if (isVerifying) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="text-xl font-semibold">ChatSphere</span>
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="size-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Verify your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase text-center">
                6-Digit Verification Code
              </label>
              <Input
                required
                type="text"
                maxLength={6}
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                placeholder="123456"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
              />
            </div>

            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-4" />}
              Verify & Complete Signup
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setIsVerifying(false)}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> Change details
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleResendCode}
              className="font-medium text-primary hover:underline"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Standard Login / Signup View
  // --------------------------------------------------------------------------
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <MessageCircleMore className="size-5" />
        </span>
        <span className="text-xl font-semibold">ChatSphere</span>
      </div>
      <div className="rounded-3xl border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">{isLogin ? "Welcome back" : "Create your space"}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{isLogin ? "Sign in to ChatSphere" : "Join ChatSphere"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{isLogin ? "Pick up your conversations exactly where you left them." : "Start direct messages and group conversations in a few moments."}</p>
        </div>

        {/* Social Auth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void handleSocialAuth("google")}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void handleSocialAuth("github")}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="size-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </Button>
        </div>

        <div className="relative mb-6 text-center text-xs text-muted-foreground uppercase">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <span className="relative bg-card px-2">Or continue with email</span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label className="grid gap-2 text-sm font-medium">Display name<Input required minLength={1} maxLength={80} autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Alex Morgan" /></label>
              <label className="grid gap-2 text-sm font-medium">Username<Input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="alex_morgan" /></label>
            </>
          )}
          <label className="grid gap-2 text-sm font-medium">Email<Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label className="grid gap-2 text-sm font-medium">Password<Input required type="password" minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
          <Button className="w-full" size="lg" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{isLogin ? "Sign in" : "Create account"}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">{isLogin ? "New to ChatSphere?" : "Already have an account?"} <Link className="font-medium text-primary hover:underline" href={isLogin ? "/signup" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link></p>
      </div>
    </div>
  );
}
