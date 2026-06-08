import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-xl ring-1 ring-border/50">
          {/* Main image */}
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          {/* Thumbnail strip */}
          <div className="flex gap-1.5 px-3 sm:px-4 py-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-10 sm:h-12 sm:w-12 rounded-md shrink-0" />
            ))}
          </div>
          {/* Content */}
          <div className="p-3 sm:p-4 pt-2 sm:pt-3 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
