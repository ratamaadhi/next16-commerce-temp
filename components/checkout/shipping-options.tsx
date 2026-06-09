"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Truck, AlertCircle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import type { ShippingOption } from "@/lib/shipping";

interface ShippingOptionsProps {
  destinationId: number;
  destinationTitle?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  onSelect: (option: ShippingOption | null) => void;
}

const GROUP_LABEL: Record<string, string> = {
  economy: "Ekonomis",
  regular: "Reguler",
  express: "Express",
  instant: "Instan",
  cargo: "Cargo",
  next_day: "Next Day",
  one_day: "Same Day",
};

const GROUP_ORDER = ["economy", "regular", "express", "instant", "next_day", "one_day", "cargo"];

export function ShippingOptions({
  destinationId,
  destinationTitle,
  weight,
  length,
  width,
  height,
  onSelect,
}: ShippingOptionsProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!destinationId) return;

    onSelect(null);

    const abortController = new AbortController();

    async function fetchCost() {
      setSelected(null);
      setOptions([]);
      setHasFetched(false);
      setActiveTab(null);
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          subdistrict_destination: String(destinationId),
          weight: String(weight),
          length: String(length),
          width: String(width),
          height: String(height),
        });
        if (destinationTitle) params.set("destinationTitle", destinationTitle);

        const res = await fetch(`/api/shipping/cost?${params}`, {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error("Shipping cost fetch failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (abortController.signal.aborted) return;
        setOptions(Array.isArray(data) ? data : []);
        setHasFetched(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Gagal mengambil ongkos kirim");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchCost();

    return () => {
      abortController.abort();
    };
  }, [destinationId, weight, length, width, height, destinationTitle, retryTrigger]);

  const grouped = useMemo(() =>
    options.reduce<Record<string, ShippingOption[]>>((acc, opt) => {
      const key = opt.group || "other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(opt);
      return acc;
    }, {}),
    [options]
  );

  const sortedGroups = useMemo(() => {
    const ordered = GROUP_ORDER.filter((g) => grouped[g]);
    Object.keys(grouped).forEach((g) => {
      if (!ordered.includes(g)) ordered.push(g);
    });
    return ordered;
  }, [grouped]);

  const effectiveTab = activeTab && grouped[activeTab] ? activeTab : sortedGroups[0] ?? "";

  const selectedGroup = selected
    ? (options.find((o) => `${o.service}-${o.name}` === selected)?.group ?? null)
    : null;

  const optionKey = (opt: ShippingOption) => `${opt.service}-${opt.name}`;

  if (!destinationId) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="size-3" />
          Mengambil ongkos kirim...
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {error}
        </div>
        <button
          type="button"
          className="text-xs text-primary flex items-center gap-1 hover:underline"
          onClick={() => {
            setError(null);
            setRetryTrigger((c) => c + 1);
          }}
        >
          <RefreshCw className="size-3" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (hasFetched && options.length === 0) {
    return (
      <div className="rounded-md border p-3 text-xs text-muted-foreground">
        Maaf, belum tersedia pengiriman ke lokasi Anda.
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-xs flex items-center gap-1.5">
        <Truck className="size-3" />
        Pilih Kurir
      </Label>

      <Tabs value={effectiveTab} onValueChange={setActiveTab} className="flex-col gap-0">
        <TabsList
          variant="line"
          className="flex w-full h-auto justify-start rounded-none p-0 bg-transparent border-b gap-0 overflow-x-auto"
        >
          {sortedGroups.map((group) => (
            <TabsTrigger
              key={group}
              value={group}
              className="h-8 text-xs px-3 rounded-none flex-none bg-transparent border-b-2 border-b-transparent shadow-none data-active:bg-transparent data-active:shadow-none data-active:border-b-primary data-active:text-foreground gap-1.5"
            >
              {GROUP_LABEL[group] ?? group}
              {selectedGroup === group && (
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedGroups.map((group) => (
          <TabsContent key={group} value={group} className="mt-3">
            <RadioGroup
              value={selected ?? ""}
              onValueChange={(val) => {
                setSelected(val);
                const opt = options.find((o) => optionKey(o) === val) ?? null;
                onSelect(opt);
              }}
            >
              <div className="rounded-md border divide-y overflow-hidden">
                {grouped[group]?.map((opt) => {
                  const key = optionKey(opt);
                  const isSelected = selected === key;
                  return (
                    <label
                      key={key}
                      htmlFor={key}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 cursor-pointer transition-all",
                        isSelected
                          ? "border-l-2 border-l-primary bg-primary/5 pl-[10px]"
                          : "border-l-2 border-l-transparent hover:bg-muted/40",
                      )}
                    >
                      <RadioGroupItem value={key} id={key} className="shrink-0" />

                      {opt.imageUrl ? (
                        <div className="relative size-8 shrink-0">
                          <Image
                            src={opt.imageUrl}
                            alt={opt.service}
                            fill
                            className="object-contain"
                            sizes="32px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="size-8 shrink-0 rounded bg-muted flex items-center justify-center">
                          <Truck className="size-3.5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-medium leading-tight">{opt.name}</p>
                          {opt.cod && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-4 leading-none font-normal"
                            >
                              COD
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Estimasi {opt.etdNamed}
                        </p>
                      </div>

                      <span className="text-xs font-semibold shrink-0 tabular-nums">
                        {formatPrice(opt.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
