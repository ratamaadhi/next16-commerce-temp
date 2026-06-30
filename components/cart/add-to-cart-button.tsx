"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: number;
  productDocumentId: string;
  productName: string;
  price: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  disabled?: boolean;
  needsVariant?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  maxQuantity?: number;
  inline?: boolean;
}

export function AddToCartButton({
  productId,
  productDocumentId,
  productName,
  price,
  image,
  variantId,
  variantName,
  variantSku,
  disabled,
  needsVariant,
  weight,
  dimensions,
  maxQuantity,
  inline,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    const added = addItem(
      {
        productId,
        productDocumentId,
        productSku: undefined,
        name: productName,
        price,
        image,
        quantity,
        variantId,
        variantName,
        variantSku,
        maxQuantity,
        weight,
        dimensions,
      },
      needsVariant,
    );
    if (!added) {
      toast.error("Silakan pilih variant terlebih dahulu");
      return;
    }
    toast.success(`${productName} ditambahkan ke keranjang!`);
    setQuantity(1);
  };

  const atMax = maxQuantity !== undefined && quantity >= maxQuantity;

  const ctaLabel =
    disabled && needsVariant
      ? "Pilih Variant"
      : disabled
        ? "Stok Habis"
        : "Tambah ke Keranjang";

  if (inline) {
    return (
      <div className="flex items-stretch gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={disabled}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center font-medium tabular-nums">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => setQuantity(quantity + 1)}
            disabled={disabled || atMax}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={disabled}
          className="min-w-0 flex-1"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {ctaLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(quantity + 1)}
          disabled={disabled || atMax}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={handleAddToCart}
        disabled={disabled}
        className="w-full"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {disabled && needsVariant
          ? "Pilih Variant"
          : disabled
            ? "Stok Habis"
            : "Tambah ke Keranjang"}
      </Button>
    </div>
  );
}
