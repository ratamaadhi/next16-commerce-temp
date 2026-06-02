import Link from "next/link";
import { getFeaturedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { buttonVariants } from "@/components/ui/button";
import type { ProductData } from "@/lib/products";

export default async function HomePage() {
  let featuredProducts: ProductData[] = [];
  try {
    const response = await getFeaturedProducts();
    featuredProducts = response.data;
  } catch {
    featuredProducts = [];
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="text-center py-16 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Selamat Datang di Store
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
          Temukan produk terbaik dengan harga terbaik.
        </p>
        <Link href="/products" className={buttonVariants({ size: "lg" })}>
          Lihat Produk
        </Link>
      </section>

      {featuredProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Produk Unggulan</h2>
            <Link href="/products" className={buttonVariants({ variant: "outline" })}>
              Lihat Semua
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}
    </main>
  );
}
