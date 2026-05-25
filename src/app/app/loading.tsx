import { Skeleton } from "@/src/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="app-layout h-svh bg-[#fefefc]">
      <div className="app-layout-inner flex h-full min-h-0 flex-col overflow-hidden bg-[#fefefc]">
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-78 shrink-0 border-r border-slate-200/70 bg-[#f9f9f9] p-2 lg:flex lg:flex-col">
            <Skeleton className="app-session-skeleton mb-3 h-11 w-[72%] rounded-[14px]" />
            <Skeleton className="app-session-skeleton mb-2 h-10 w-full rounded-[14px]" />
            <Skeleton className="app-session-skeleton mb-2 h-10 w-full rounded-[14px]" />
            <Skeleton className="app-session-skeleton mb-2 h-10 w-full rounded-[14px]" />
            <div className="mt-auto space-y-2 border-t border-slate-200 pt-3">
              <Skeleton className="app-session-skeleton h-10 w-full rounded-[14px]" />
              <Skeleton className="app-session-skeleton h-10 w-full rounded-[14px]" />
            </div>
          </aside>

          <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fefefc]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 px-4 md:px-6">
              <Skeleton className="app-session-skeleton h-6 w-36 rounded-full" />
              <Skeleton className="app-session-skeleton h-9 w-28 rounded-full" />
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Skeleton className="app-session-skeleton h-12 w-12 rounded-full" />
                  <span
                    className="absolute inset-0 rounded-full border-2 border-slate-400/70 border-t-transparent animate-spin"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-center text-[13px] tracking-[0.14em] text-slate-500 uppercase">
                  Loading...
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
