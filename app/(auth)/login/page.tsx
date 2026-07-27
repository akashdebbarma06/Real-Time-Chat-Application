import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <Suspense fallback={<Skeleton className="h-[480px] w-full max-w-md rounded-3xl" />}><AuthForm mode="login" /></Suspense>;
}
