"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_TITLES } from "./constants";
import { Search, X } from "lucide-react";

export function OrderFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentSearch = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateParams = useCallback(
    (status: string, search: string) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const query = params.toString();
      router.push(`/orders${query ? `?${query}` : ""}`);
    },
    [router],
  );

  const handleStatusClick = (status: string) => {
    const next = currentStatus === status ? "" : status;
    updateParams(next, currentSearch);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams(currentStatus, value);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    updateParams(currentStatus, "");
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      {/* Status chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            className={cn(
              "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200",
              currentStatus === status
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
            )}
          >
            {ORDER_STATUS_TITLES[status] ?? status}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative sm:ml-auto sm:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari no. pesanan..."
          className="w-full h-9 rounded-full border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-shadow"
        />
        {searchValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
