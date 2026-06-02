import { Star } from "lucide-react";

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  user?: {
    username: string;
  };
  createdAt: string;
}

export function ReviewSection() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Review akan dimuat dari Strapi API.
      </p>
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
        {review.verified && (
          <span className="ml-2 text-xs text-green-600 font-medium">Verified</span>
        )}
      </div>
      <h4 className="font-semibold">{review.title}</h4>
      <p className="text-sm text-muted-foreground">{review.comment}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{review.user?.username || "Anonymous"}</span>
        <span>{new Date(review.createdAt).toLocaleDateString("id-ID")}</span>
      </div>
    </div>
  );
}
