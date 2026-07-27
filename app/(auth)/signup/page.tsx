import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return <Suspense fallback={<Skeleton className="h-[620px] w-full max-w-md rounded-3xl" />}><AuthForm mode="signup" /></Suspense>;
}
