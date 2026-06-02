import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";

export default function ProductsLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
      <ProductGridSkeleton count={12} />
    </main>
  );
}
