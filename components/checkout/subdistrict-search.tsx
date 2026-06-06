"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubdistrictResult } from "@/lib/shipping";

interface SubdistrictSearchProps {
  onSelect: (result: { id: number; title: string }) => void;
}

export function SubdistrictSearch({ onSelect }: SubdistrictSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SubdistrictResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/shipping/search-district?keyword=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch {
        setError("Gagal mencari lokasi");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: SubdistrictResult) {
    const title = [result.name, result.city, result.province]
      .filter(Boolean)
      .join(", ");
    setQuery(result.name);
    setIsOpen(false);
    setResults([]);
    onSelect({ id: result.id, title });
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <Label className="text-xs">Kecamatan / Kelurahan</Label>
      <Input
        placeholder="Cari kecamatan atau kelurahan..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect({ id: 0, title: "" });
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
      />
      {isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md p-2 text-xs text-muted-foreground">
          Mencari...
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
              onClick={() => handleSelect(r)}
            >
              <span className="font-medium">{r.name}</span>
              {r.city && (
                <span className="text-muted-foreground">, {r.city}</span>
              )}
              {r.province && (
                <span className="text-muted-foreground">, {r.province}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && results.length === 0 && !isLoading && query.length >= 3 && (
        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md p-2 text-xs text-muted-foreground">
          Tidak ada hasil
        </div>
      )}
    </div>
  );
}
