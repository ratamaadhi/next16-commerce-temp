"use client";

import React, { useState, useEffect, useRef, startTransition } from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubdistrictResult } from "@/lib/shipping";

interface SubdistrictSearchProps {
  onSelect: (result: SubdistrictResult | null) => void;
  initialSubdistrict?: SubdistrictResult | null;
}

function formatFullLocation(r: SubdistrictResult): string {
  const parts = [r.sub_district_name, r.district_name, r.city_name, r.province_name].filter(
    Boolean,
  );
  return parts.join(", ");
}

export function SubdistrictSearch({ onSelect, initialSubdistrict = null }: SubdistrictSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SubdistrictResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<SubdistrictResult | null>(initialSubdistrict);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.length < 3) {
      startTransition(() => setResults([]));
      return;
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/shipping/search-district?keyword=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResults(Array.isArray(data.subdistricts) ? data.subdistricts : []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handleSelect(result: SubdistrictResult) {
    setSelected(result);
    setOpen(false);
    onSelect(result);
  }

  const displayValue = selected ? formatFullLocation(selected) : "";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Kecamatan / Kelurahan</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <MapPin className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected ? displayValue : "Cari kecamatan atau kelurahan..."}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50 ml-2" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Ketik minimal 3 huruf..."
              value={query}
              onValueChange={(val) => {
                setQuery(val);
                if (selected) {
                  setSelected(null);
                  onSelect(null);
                }
              }}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Mencari lokasi...
                </div>
              )}
              {!isLoading && query.length < 3 && (
                <CommandEmpty>Ketik minimal 3 huruf untuk mencari.</CommandEmpty>
              )}
              {!isLoading && query.length >= 3 && results.length === 0 && (
                <CommandEmpty>Lokasi tidak ditemukan.</CommandEmpty>
              )}
              {!isLoading && results.length > 0 && (
                <CommandGroup>
                  {results.map((r, i) => (
                    <React.Fragment key={r.id}>
                      {i > 0 && <CommandSeparator />}
                      <CommandItem
                        value={String(r.id)}
                        onSelect={() => handleSelect(r)}
                        className="flex items-start gap-2 py-3 rounded-none data-[selected=false]:bg-transparent aria-selected:bg-accent"
                      >
                        <Check
                          className={cn(
                            "size-3.5 mt-0.5 shrink-0",
                            selected?.id === r.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight">{r.sub_district_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            {[r.district_name, r.city_name, r.province_name]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </CommandItem>
                    </React.Fragment>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
