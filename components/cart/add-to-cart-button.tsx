"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: number;
  productName: string;
  price: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  disabled?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
}

export function AddToCartButton({
  productId,
  productName,
  price,
  image,
  variantId,
  variantName,
  disabled,
  weight,
  dimensions,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      productId,
      name: productName,
      price,
      image,
      quantity,
      variantId,
      variantName,
      weight,
      dimensions,
    });
    toast.success(`${productName} ditambahkan ke keranjang!`);
    setQuantity(1);
  };

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
          disabled={disabled}
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
        {disabled ? "Stok Habis" : "Tambah ke Keranjang"}
      </Button>
    </div>
  );
}
