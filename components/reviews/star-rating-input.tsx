"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn(
            "p-0.5 transition-transform duration-150 rounded-sm",
            !disabled && "hover:scale-110 cursor-pointer",
            disabled && "cursor-default",
          )}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onClick={() => !disabled && onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-6 transition-colors duration-150",
              star <= displayValue
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/30",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
