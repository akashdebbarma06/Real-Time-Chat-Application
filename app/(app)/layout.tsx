import { getCurrentProfile } from "@/lib/current-user";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await getCurrentProfile();
  return children;
}
