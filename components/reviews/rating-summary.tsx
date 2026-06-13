import { Star } from "lucide-react";
import type { ReviewItem } from "@/lib/reviews";

interface RatingSummaryProps {
  reviews: ReviewItem[];
}

function getStarCounts(reviews: ReviewItem[]) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = r.rating - 1;
    if (idx >= 0 && idx < 5) counts[idx]++;
  });
  return counts;
}

export function RatingSummary({ reviews }: RatingSummaryProps) {
  const total = reviews.length;
  if (total === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const counts = getStarCounts(reviews);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-xl border bg-card">
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-4xl font-bold text-foreground tabular-nums">
          {avg.toFixed(1)}
        </span>
        <div className="flex items-center gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={
                star <= Math.round(avg)
                  ? "size-3.5 fill-amber-400 text-amber-400"
                  : "size-3.5 fill-none text-muted-foreground/30"
              }
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-1">{total} ulasan</span>
      </div>

      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground tabular-nums text-right">{star}</span>
              <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={1.5} />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-muted-foreground tabular-nums text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
