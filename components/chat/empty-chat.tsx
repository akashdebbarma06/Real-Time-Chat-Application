import { MessageCircleMore, Search, UsersRound } from "lucide-react";

export function EmptyChat() {
  return (
    <section className="hidden h-svh items-center justify-center bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_38%)] p-8 md:flex">
      <div className="max-w-md text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl border bg-card shadow-xl shadow-primary/5"><MessageCircleMore className="size-9 text-primary" /></div>
        <h2 className="mt-7 text-2xl font-semibold tracking-tight">Your conversations, all in one sphere</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Choose a conversation from the sidebar, search for someone, or start a group.</p>
        <div className="mt-7 grid grid-cols-2 gap-3 text-left text-sm">
          <div className="rounded-2xl border bg-card p-4"><Search className="mb-3 size-5 text-primary" /><p className="font-medium">Find anyone</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Search users and conversations instantly.</p></div>
          <div className="rounded-2xl border bg-card p-4"><UsersRound className="mb-3 size-5 text-primary" /><p className="font-medium">Build a group</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Bring the right people into one room.</p></div>
        </div>
      </div>
    </section>
  );
}
