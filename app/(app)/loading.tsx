import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="grid h-svh md:grid-cols-[360px_1fr]"><section className="space-y-4 border-r p-4"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-10 w-full" />{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)}</section><section className="hidden p-8 md:block"><Skeleton className="h-16 w-full" /><div className="mx-auto mt-20 max-w-3xl space-y-5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className={`h-14 rounded-2xl ${index % 2 ? "mr-auto w-1/2" : "ml-auto w-2/3"}`} />)}</div></section></main>;
}
