"use client";

import { useState } from "react";
import { ProductImage } from "@/components/products/product-image";
import type { StrapiImage } from "@/lib/products";

interface ProductImagesProps {
  images: StrapiImage[];
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="relative aspect-square rounded-lg">
        <ProductImage image={null} alt={productName} fill className="rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <ProductImage
          image={images[selectedIndex]}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={`Galeri gambar ${productName}`}>
          {images.map((img, index) => (
            <button
              key={img.url}
              onClick={() => setSelectedIndex(index)}
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Lihat gambar ${index + 1} dari ${images.length}`}
              className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                index === selectedIndex ? "border-primary" : "border-transparent hover:border-muted-foreground"
              }`}
            >
              <ProductImage
                image={img}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
