"use client";

import { useState } from "react";
import { StarRatingInput } from "./star-rating-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  productDocumentId: string;
  orderNumber: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function ReviewForm({ productDocumentId, orderNumber, onSuccess, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = rating > 0 && title.trim().length > 0 && comment.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
          productDocumentId,
          orderNumber,
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim review");
        return;
      }

      toast.success("Review terkirim! Menunggu moderasi.");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Rating</Label>
        <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
        {rating > 0 && (
          <p className="text-xs text-muted-foreground">
            {rating === 5 ? "Luar Biasa!" : rating === 4 ? "Bagus!" : rating === 3 ? "Cukup" : rating === 2 ? "Kurang" : "Buruk"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="review-title">Judul Review</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ringkasan pengalaman Anda"
          maxLength={200}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="review-comment">Ulasan Anda</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda dengan produk ini..."
          rows={4}
          required
          disabled={isSubmitting}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          disabled={isSubmitting}
          className="size-4 rounded border-border accent-primary"
        />
        <span>Sebagai anonim</span>
      </label>

      <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Mengirim...
          </>
        ) : (
          "Kirim Review"
        )}
      </Button>
    </form>
  );
}
