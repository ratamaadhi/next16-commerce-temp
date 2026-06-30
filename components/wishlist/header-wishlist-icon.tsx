"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export function HeaderWishlistIcon() {
  const { isAuthenticated } = useAuth();
  const { data: wishlist = [] } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isAuthenticated) return null;

  const itemCount = wishlist.length;

  return (
    <Link
      href="/wishlist"
      className={buttonVariants({ variant: "ghost", size: "icon" })}
      aria-label="Favorit"
    >
      <div className="relative">
        <Heart className="h-5 w-5" />
        {mounted && itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-background">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </div>
    </Link>
  );
}
