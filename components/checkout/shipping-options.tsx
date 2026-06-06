"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Truck, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/strapi";
import type { ShippingOption } from "@/lib/shipping";

interface ShippingOptionsProps {
  destinationId: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  onSelect: (option: ShippingOption | null) => void;
}

export function ShippingOptions({
  destinationId,
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
  const [hasFetched, setHasFetched] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!destinationId) return;

    setSelected(null);
    setOptions([]);
    setHasFetched(false);

    async function fetchCost() {
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
        const res = await fetch(`/api/shipping/cost?${params}`);
        if (!res.ok) throw new Error("Shipping cost fetch failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOptions(Array.isArray(data) ? data : []);
        setHasFetched(true);
      } catch {
        setError("Gagal mengambil ongkos kirim");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCost();
  }, [destinationId, weight, length, width, height, retryTrigger]);

  if (!destinationId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Mengambil ongkos kirim...
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="size-3" />
          {error}
        </div>
        <button
          type="button"
          className="text-xs text-primary flex items-center gap-1"
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
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        <Truck className="size-3" />
        Pilih Kurir
      </Label>
      <div className="rounded-md border divide-y">
        {options.map((opt) => {
          const isSelected = selected === opt.name;
          return (
            <label
              key={opt.name}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shipping-option"
                  className="size-3.5 accent-primary"
                  checked={isSelected}
                  onChange={() => {
                    setSelected(opt.name);
                    onSelect(opt);
                  }}
                />
                <div>
                  <p className="text-xs font-medium">{opt.name}</p>
                  {opt.etd && (
                    <p className="text-[10px] text-muted-foreground">
                      Estimasi: {opt.etd}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold">{formatPrice(opt.price)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
