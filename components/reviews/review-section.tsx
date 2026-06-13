import { RatingSummary } from "./rating-summary";
import { ReviewList } from "./review-list";
import type { ReviewItem } from "@/lib/reviews";

interface ReviewSectionProps {
  reviews: ReviewItem[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  return (
    <div className="space-y-6">
      <RatingSummary reviews={reviews} />
      <ReviewList reviews={reviews} />
    </div>
  );
}
