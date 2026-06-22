"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SearchBar } from "./search-bar";

export function MobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "md:hidden min-h-[44px] min-w-[44px]"
        )}
        aria-label="Cari produk"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute inset-0 z-10 flex items-center gap-2 px-4 bg-background/95 backdrop-blur animate-slide-up [animation-duration:150ms] md:hidden">
          <SearchBar autoFocus onClose={() => setOpen(false)} />
          <button
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "shrink-0 min-h-[44px] min-w-[44px]"
            )}
            aria-label="Tutup pencarian"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
