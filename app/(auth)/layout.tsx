import { MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-svh overflow-hidden lg:grid-cols-[1.05fr_.95fr]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_32%),radial-gradient(circle_at_82%_76%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_34%)]" />
      <section className="hidden border-r bg-foreground px-12 py-14 text-background lg:flex lg:flex-col lg:justify-between dark:bg-card dark:text-foreground">
        <div className="flex items-center gap-3 text-xl font-semibold"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"><MessageCircleMore className="size-5" /></span>ChatSphere</div>
        <div className="max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80 dark:text-foreground/80"><Sparkles className="size-4" />Conversations that feel instant</div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight">A focused space for teams, friends, and everything in between.</h1>
          <p className="max-w-lg text-lg leading-8 text-white/65 dark:text-muted-foreground">Private realtime messaging, expressive profiles, file sharing, and calm collaboration—without the clutter.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="mb-3 size-5 text-primary" /><p className="font-medium">Secure by default</p><p className="mt-1 text-sm text-white/55 dark:text-muted-foreground">Row-level policies protect conversations and files.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><MessageCircleMore className="mb-3 size-5 text-primary" /><p className="font-medium">Realtime everywhere</p><p className="mt-1 text-sm text-white/55 dark:text-muted-foreground">Presence, typing, receipts, and live messages.</p></div>
          </div>
        </div>
        <p className="text-sm text-white/45 dark:text-muted-foreground">Built with Next.js and Supabase.</p>
      </section>
      <section className="flex min-h-svh flex-col items-center justify-between p-6 sm:p-10">
        <div className="w-full" />
        <div className="w-full flex justify-center">{children}</div>
        <footer className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <a href="/about" className="hover:underline">About</a>
          <a href="/contact" className="hover:underline">Contact</a>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          <a href="/terms" className="hover:underline">Terms of Service</a>
          <a href="/cookies" className="hover:underline">Cookie Policy</a>
        </footer>
      </section>
    </main>
  );
}
