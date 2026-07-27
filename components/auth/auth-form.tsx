"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, MessageCircleMore, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<"google" | "github" | false>(false);

  // Admin Login States
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSocialAuth(provider: "google" | "github") {
    setLoading(provider);
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chatsphere-tan.vercel.app";
    const origin =
      typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost")
        ? window.location.origin
        : siteUrl;

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

  async function handleAdminSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error) throw error;

      toast.success("Signed in as Administrator");
      setAdminOpen(false);
      router.replace(searchParams.get("next") || "/chat");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "Admin login failed";
      toast.error(message || "Admin authentication failed");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="text-xl font-semibold">ChatSphere</span>
        </div>
      </div>

      <div className="relative rounded-3xl border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
        {/* Top Right Admin Login Button */}
        <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
          <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Lock className="size-3.5" />
                <span>Admin Login</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <DialogTitle>Administrator Login</DialogTitle>
                <DialogDescription>
                  Sign in with your admin credentials to manage ChatSphere.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAdminSubmit} className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Admin Email</label>
                  <Input
                    required
                    type="email"
                    placeholder="admin@chatsphere.app"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={adminLoading}>
                  {adminLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Sign In as Admin
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8 text-center sm:text-left pr-24 sm:pr-28">
          <p className="text-sm font-medium text-primary">{isLogin ? "Welcome back" : "Create your space"}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {isLogin ? "Sign in to ChatSphere" : "Join ChatSphere"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isLogin
              ? "Pick up your conversations instantly with one click."
              : "Start direct messages and group conversations in seconds."}
          </p>
        </div>

        {/* 1-Click Social Sign-In Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading !== false}
            onClick={() => void handleSocialAuth("google")}
            className="w-full flex items-center justify-center gap-3 h-12 text-sm font-medium border-muted-foreground/20 hover:bg-accent"
          >
            {loading === "google" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <svg className="size-5" viewBox="0 0 24 24">
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
            )}
            <span>Continue with Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading !== false}
            onClick={() => void handleSocialAuth("github")}
            className="w-full flex items-center justify-center gap-3 h-12 text-sm font-medium border-muted-foreground/20 hover:bg-accent"
          >
            {loading === "github" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <svg className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>Continue with GitHub</span>
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
          By continuing, you agree to ChatSphere&apos;s{" "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
