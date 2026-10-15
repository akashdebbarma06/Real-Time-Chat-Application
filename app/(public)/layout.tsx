import { PublicShellHeader } from "@/components/layout/public-shell-header";
import { PublicShellFooter } from "@/components/layout/public-shell-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0F1115] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <PublicShellHeader />

      {/* Main Landmark */}
      <main id="main-content" className="flex-1 focus:outline-none">
        {children}
      </main>

      <PublicShellFooter />
    </div>
  );
}

