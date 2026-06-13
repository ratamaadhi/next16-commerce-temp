"use client";

import { useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewItem } from "@/lib/reviews";

interface ReviewListProps {
  reviews: ReviewItem[];
}

const PER_PAGE = 5;

export function ReviewList({ reviews }: ReviewListProps) {
  const [visible, setVisible] = useState(PER_PAGE);
  const hasMore = visible < reviews.length;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Belum ada ulasan untuk produk ini.</p>
        <p className="text-xs mt-1">Jadilah yang pertama memberikan ulasan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, visible).map((review, idx) => (
        <div
          key={review.documentId ?? review.id}
          className="rounded-lg border bg-card p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${idx % PER_PAGE * 75}ms`, animationFillMode: "backwards" }}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`size-3.5 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-muted-foreground/30"
                }`}
                strokeWidth={1.5}
              />
            ))}
            {review.verified && (
              <BadgeCheck className="ml-1 size-3.5 text-muted-foreground" aria-label="Verified Purchase" />
            )}
          </div>
          <h4 className="font-semibold text-sm text-foreground">{review.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{review.user?.username || "Anonim"}</span>
            <span>
              {new Date(review.createdAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((prev) => prev + PER_PAGE)}
          >
            Muat lebih banyak ({reviews.length - visible} ulasan)
          </Button>
        </div>
      )}
    </div>
  );
}
