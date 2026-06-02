"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/strapi";

interface Variant {
  id?: number;
  name: string;
  sku?: string;
  price: number;
  inventory?: number;
}

interface VariantSelectorProps {
  variants: Variant[];
}

export function VariantSelector({ variants }: VariantSelectorProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const current = selected !== null ? variants[selected] : null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground">
        Varian: <span className="text-foreground">{current?.name || "Pilih varian"}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant, index) => (
          <Button
            key={variant.name}
            variant={selected === index ? "default" : "outline"}
            size="sm"
            onClick={() => setSelected(index)}
          >
            {variant.name}
            {variant.price > 0 && (
              <span className="ml-1 text-xs opacity-70">
                (+{formatPrice(variant.price)})
              </span>
            )}
          </Button>
        ))}
      </div>
      {current && current.inventory !== undefined && current.inventory <= 5 && current.inventory > 0 && (
        <p className="text-sm text-amber-600">
          Sisa {current.inventory} unit
        </p>
      )}
    </div>
  );
}
