"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  autoFocus?: boolean;
  onClose?: () => void;
}

export function SearchBar({ autoFocus, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md" role="search">
      <label htmlFor="product-search" className="sr-only">
        Cari produk
      </label>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id="product-search"
        type="search"
        placeholder="Cari produk..."
        className="pl-10"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />
    </form>
  );
}
