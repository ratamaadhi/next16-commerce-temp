import { Suspense } from "react";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Pagination } from "@/components/common/pagination";
import { CategoryFilter } from "@/components/products/category-filter";
import { SortSelect } from "@/components/products/sort-select";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category;
  const sort = params.sort;

  const response = await getProducts(page, 12, category);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {category ? `Kategori: ${category}` : "Semua Produk"}
      </h1>

      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <CategoryFilter currentSlug={category} />
        <SortSelect currentSort={sort} />
      </div>

      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductGrid products={response.data} />
      </Suspense>

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={response.meta.pagination.pageCount}
          basePath="/products"
          queryParams={{ category, sort }}
        />
      </div>
    </main>
  );
}
