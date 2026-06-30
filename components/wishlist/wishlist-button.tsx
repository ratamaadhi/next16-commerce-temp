"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist, useIsInWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { toast } from "sonner";

interface WishlistButtonProps {
  productDocumentId: string;
  variant?: "card" | "detail";
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

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isInWishlist ? "Hapus dari favorit" : "Tambah ke favorit"}
        className={cn(
          "absolute top-2 right-2 z-10",
          "flex items-center justify-center",
          "size-8 rounded-full",
          "bg-white/90 hover:bg-white shadow-sm",
          "transition-all duration-200 ease-out",
          isLoading && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-colors duration-200",
            isInWishlist
              ? "fill-[#E8B4B8] stroke-[#E8B4B8]"
              : "stroke-muted-foreground hover:stroke-[#E8B4B8]",
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
      className={cn(
        "flex items-center justify-center",
        "size-11 rounded-lg border-2 border-border",
        "hover:border-[#E8B4B8] transition-colors duration-200",
        "bg-background",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-5 transition-colors duration-200",
          isInWishlist
            ? "fill-[#E8B4B8] stroke-[#E8B4B8]"
            : "stroke-muted-foreground hover:stroke-[#E8B4B8]",
        )}
      />
    </button>
  );
}
