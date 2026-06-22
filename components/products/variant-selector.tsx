"use client";

import { Button } from "@/components/ui/button";

interface Variant {
  id?: number;
  name: string;
  sku?: string;
  price: number;
  inventory?: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function VariantSelector({ variants, selectedIndex, onSelect }: VariantSelectorProps) {
  const current = selectedIndex !== null ? variants[selectedIndex] : null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground">
        Varian: <span className="text-foreground">{current?.name || "Pilih varian"}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant, index) => (
          <Button
            key={variant.name}
            variant={selectedIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(index)}
          >
            {variant.name}
          </Button>
        ))}
      </div>
      {current && current.inventory !== undefined && current.inventory <= 5 && current.inventory > 0 && (
        <p className="text-sm text-warning-foreground">
          Sisa {current.inventory} unit
        </p>
      )}
    </div>
  );
}
