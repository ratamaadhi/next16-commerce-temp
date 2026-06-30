"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  useWishlist,
  useIsInWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/hooks/use-wishlist";
import { toast } from "sonner";

interface WishlistButtonProps {
  productDocumentId: string;
  variant?: "card" | "detail" | "title";
  className?: string;
}

export function WishlistButton({
  productDocumentId,
  variant = "card",
  className,
}: WishlistButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: wishlist = [] } = useWishlist();
  const isInWishlist = useIsInWishlist(productDocumentId);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const wishlistItem = wishlist.find(
    (item) => item.product.documentId === productDocumentId,
  );
  const wishlistDocumentId = wishlistItem?.documentId;

  const isLoading = addToWishlist.isPending || removeFromWishlist.isPending;

  // Bounce the heart on the transition into the saved state
  const prevInWishlist = useRef(isInWishlist);
  const [bouncing, setBouncing] = useState(false);
  useEffect(() => {
    if (prevInWishlist.current === isInWishlist) return;
    prevInWishlist.current = isInWishlist;
    setBouncing(true);
    const t = window.setTimeout(() => setBouncing(false), 480);
    return () => window.clearTimeout(t);
  }, [isInWishlist]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Silakan login untuk menambahkan favorit");
      router.push("/auth/login");
      return;
    }

    if (isInWishlist && wishlistDocumentId) {
      removeFromWishlist.mutate(wishlistDocumentId);
    } else {
      addToWishlist.mutate(productDocumentId);
    }
  };

  const baseInteractive =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isInWishlist ? "Hapus dari favorit" : "Tambah ke favorit"}
        aria-pressed={isInWishlist}
        className={cn(
          // Hit area expanded to ≥44px (WCAG) while visual stays 32px
          "absolute top-2 right-2 z-10",
          "flex items-center justify-center",
          "min-h-11 min-w-11 p-1.5",
          "rounded-full",
          "bg-card/85 hover:bg-card shadow-sm ring-1 ring-border/40",
          "backdrop-blur-sm",
          "transition-colors duration-200 ease-out",
          "active:scale-90 transition-transform",
          baseInteractive,
          isLoading && "opacity-60 cursor-not-allowed",
          className,
        )}
      >
        <Heart
          className={cn(
            "size-4",
            "transition-[fill,stroke,transform] duration-200 ease-out",
            isInWishlist
              ? "fill-accent stroke-accent"
              : "stroke-muted-foreground group-hover/wishlist:stroke-accent hover:stroke-accent",
            bouncing && "motion-safe:animate-heart-bounce",
          )}
        />
      </button>
    );
  }

  if (variant === "title") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isInWishlist ? "Hapus dari favorit" : "Tambah ke favorit"}
        aria-pressed={isInWishlist}
        className={cn(
          "flex shrink-0 items-center justify-center",
          "size-9 rounded-full",
          "transition-colors duration-200 ease-out",
          "hover:bg-accent/10",
          "active:scale-90",
          baseInteractive,
          isLoading && "opacity-60 cursor-not-allowed",
          className,
        )}
      >
        <Heart
          className={cn(
            "size-5",
            "transition-[fill,stroke] duration-200 ease-out",
            isInWishlist
              ? "fill-accent stroke-accent"
              : "stroke-muted-foreground hover:stroke-accent",
            bouncing && "motion-safe:animate-heart-bounce",
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isInWishlist ? "Hapus dari favorit" : "Tambah ke favorit"}
      aria-pressed={isInWishlist}
      className={cn(
        "flex items-center justify-center",
        "size-9 rounded-lg border-2",
        "bg-background",
        "transition-all duration-200 ease-out",
        "hover:bg-secondary/40 hover:shadow-sm",
        isInWishlist ? "border-accent" : "border-border hover:border-accent/50",
        "active:scale-95",
        baseInteractive,
        isLoading && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-5",
          "transition-[fill,stroke] duration-200 ease-out",
          isInWishlist
            ? "fill-accent stroke-accent"
            : "stroke-muted-foreground hover:stroke-accent",
          bouncing && "motion-safe:animate-heart-bounce",
        )}
      />
    </button>
  );
}
