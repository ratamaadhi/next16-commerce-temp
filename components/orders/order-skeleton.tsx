import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-14" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <CardSkeleton />
      <div className="opacity-60">
        <CardSkeleton />
      </div>
      <div className="opacity-30">
        <CardSkeleton />
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {/* Timeline skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-3 w-28 mb-5" />
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <Skeleton className="h-8 w-8 rounded-full mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="h-3 w-24 mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0">
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Skeleton className="h-3 w-20 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
