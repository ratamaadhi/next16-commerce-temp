"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { Package } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";

interface ProductImageProps extends Omit<ImageProps, "src" | "alt"> {
  image?: { url: string; alternativeText?: string | null } | string | null;
  alt: string;
}

export function ProductImage({ image, alt, className, ...props }: ProductImageProps) {
  const [isError, setIsError] = useState(false);

  const rawUrl = !image ? null : typeof image === "string" ? image : image.url;
  const src = rawUrl ? getStrapiMedia(rawUrl) : null;
  const showFallback = !src || isError;

  if (showFallback) {
    const { fill, width, height } = props;

    if (fill) {
      return (
        <div
          className={cn("absolute inset-0 flex items-center justify-center bg-muted", className)}
        >
          <Package className="h-16 w-16 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div
        className={cn("flex items-center justify-center bg-muted", className)}
        style={{ width, height }}
      >
        <Package className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image src={src} alt={alt} className={className} onError={() => setIsError(true)} {...props} />
  );
}
