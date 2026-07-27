"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircleMore } from "lucide-react";
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
          toast.success("Check your email to confirm your account");
          router.replace("/login");
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

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><MessageCircleMore className="size-5" /></span><span className="text-xl font-semibold">ChatSphere</span></div>
      <div className="rounded-3xl border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">{isLogin ? "Welcome back" : "Create your space"}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{isLogin ? "Sign in to ChatSphere" : "Join ChatSphere"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{isLogin ? "Pick up your conversations exactly where you left them." : "Start direct messages and group conversations in a few moments."}</p>
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
