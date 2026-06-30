"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, getStrapiMedia } from "@/lib/strapi";
import { useEffect } from "react";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: wishlist = [], isLoading, error } = useWishlist();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Favorit Saya</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="aspect-[3/4] bg-muted animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Gagal memuat wishlist</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </main>
    );
  }

  if (!wishlist.length) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold mt-4">Belum Ada Favorit</h1>
        <p className="text-muted-foreground mt-2">
              Yuk, tambahkan produk favorit kamu!
        </p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Lihat Produk
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Favorit Saya ({wishlist.length})
        </h1>
        <Link href="/products" className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Lanjut Belanja
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          const image = item.product.images?.[0];
          const imageUrl = image
            ? getStrapiMedia(image.formats?.small?.url ?? image.url)
            : null;

          return (
            <Card
              key={item.documentId}
              className="group/card flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ring-1 ring-border/50"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50">
                <Link href={`/products/${item.product.slug}`} className="block h-full">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover transition-transform duration-400 ease-out group-hover/card:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No Image</span>
                    </div>
                  )}
                </Link>

                <WishlistButton
                  productDocumentId={item.product.documentId}
                  variant="card"
                />
              </div>

              <Link href={`/products/${item.product.slug}`} className="flex-1">
                <div className="p-3 sm:p-4">
                  <h3 className="font-[family-name:var(--font-playfair)] font-semibold text-base sm:text-lg line-clamp-1">
                    {item.product.name}
                  </h3>
                  <p className="font-bold text-primary mt-1">
                    {formatPrice(item.product.price)}
                  </p>
                </div>
              </Link>

              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <Link
                  href={`/products/${item.product.slug}`}
                  className={buttonVariants({ size: "sm", className: "w-full" })}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
