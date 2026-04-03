import { Skeleton } from "@/src/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 px-1 py-2 md:px-2">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
          <div className="flex justify-end">
            <div className="w-full max-w-[46%] min-w-[180px]">
              <Skeleton className="app-session-skeleton ml-auto mb-2 h-3 w-[min(260px,38vw)] rounded-full" />
              <Skeleton className="app-session-skeleton ml-auto h-3 w-[min(180px,28vw)] rounded-full" />
            </div>
          </div>

          <div className="flex justify-start">
            <div className="w-full max-w-[62%] min-w-[220px]">
              <Skeleton className="app-session-skeleton mb-2 h-3 w-[min(360px,52vw)] rounded-full" />
              <Skeleton className="app-session-skeleton mb-2 h-3 w-[min(430px,60vw)] rounded-full" />
              <Skeleton className="app-session-skeleton h-3 w-[min(280px,40vw)] rounded-full" />
            </div>
          </div>

          <div className="flex justify-start">
            <div className="w-full max-w-[68%] min-w-[240px]">
              <Skeleton className="app-session-skeleton mb-2 h-3 w-[min(460px,64vw)] rounded-full" />
              <Skeleton className="app-session-skeleton mb-2 h-3 w-[min(520px,70vw)] rounded-full" />
              <Skeleton className="app-session-skeleton h-3 w-[min(310px,44vw)] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-1 pb-2 md:px-2">
        <div className="mx-auto max-w-[820px]">
          <div className="px-3 py-3">
            <Skeleton className="app-session-skeleton h-4 w-[72%] rounded-full" />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Skeleton className="app-session-skeleton h-8 w-8 rounded-[10px]" />
                <Skeleton className="app-session-skeleton h-8 w-8 rounded-[10px]" />
              </div>
              <Skeleton className="app-session-skeleton h-8 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
