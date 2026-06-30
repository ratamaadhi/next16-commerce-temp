"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/products/product-card";
import { useEffect } from "react";
import type { ProductData } from "@/lib/products";

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
        {wishlist.map((item) => (
          <ProductCard key={item.documentId} product={item.product as ProductData} />
        ))}
      </div>
    </main>
  );
}
