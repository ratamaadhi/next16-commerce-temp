"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryParams?: Record<string, string | undefined>;
}

export function Pagination({ currentPage, totalPages, basePath, queryParams }: PaginationProps) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  };

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Button variant="outline" size="sm" onClick={() => navigateToPage(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => navigateToPage(page)}
          >
            {page}
          </Button>
        )
      )}

      {currentPage < totalPages && (
        <Button variant="outline" size="sm" onClick={() => navigateToPage(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
