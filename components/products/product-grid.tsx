import { ProductCard } from "./product-card";
import type { ProductData } from "@/lib/products";

interface ProductGridProps {
  products: ProductData[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Tidak ada produk ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
