"use client";

import Image from "next/image";
import { getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import type { StrapiImage } from "@/lib/products";

interface ThumbnailStripProps {
  images: StrapiImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ThumbnailStrip({ images, activeIndex, onSelect }: ThumbnailStripProps) {
  if (!images?.length) return null;

  return (
    <div
      className={cn(
        "flex gap-1.5 px-3 sm:px-4 py-2",
        images.length > 4 && "overflow-x-auto scrollbar-none snap-x snap-mandatory",
      )}
    >
      {images.map((image, index) => (
        <button
          key={image.url}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(index);
          }}
          aria-current={activeIndex === index ? "true" : undefined}
          className={cn(
            "relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-300 ease-out snap-start",
            activeIndex === index
              ? "border-primary ring-1 ring-primary/30"
              : "border-transparent hover:border-primary/50",
          )}
        >
          <Image
            src={getStrapiMedia(image.formats?.thumbnail?.url ?? image.url)}
            alt={image.alternativeText || `Image ${index + 1}`}
            fill
            className="object-cover"
            sizes="48px"
          />
        </button>
      ))}
    </div>
  );
}
