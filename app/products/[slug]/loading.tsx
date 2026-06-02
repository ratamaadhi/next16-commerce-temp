import { ProductDetailSkeleton } from "@/components/products/product-detail-skeleton";

export default function ProductDetailLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <ProductDetailSkeleton />
    </main>
  );
}
