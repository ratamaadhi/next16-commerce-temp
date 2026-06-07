import { Suspense } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Pagination } from "@/components/common/pagination";
import { CategoryFilter } from "@/components/products/category-filter";
import { SortSelect } from "@/components/products/sort-select";
import { buttonVariants } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category;
  const sort = params.sort;
  const search = params.search;

  const [productsResponse, catResponse] = await Promise.all([
    getProducts(page, 12, category, sort, search),
    getCategories(),
  ]);

  const categoryName = category
    ? (catResponse.data.find((c) => c.slug === category)?.name ?? category)
    : undefined;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">
          {search
            ? `Hasil pencarian: "${search}"`
            : categoryName
              ? `Kategori: ${categoryName}`
              : "Semua Produk"}
        </h1>
        {search && (
          <Link href="/products" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <X className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <CategoryFilter
          currentSlug={category}
          categories={catResponse.data.map((c) => ({ slug: c.slug, name: c.name }))}
        />
        <SortSelect currentSort={sort} />
      </div>

      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductGrid products={productsResponse.data} />
      </Suspense>

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={productsResponse.meta.pagination.pageCount}
          basePath="/products"
          queryParams={{ category, sort, search }}
        />
      </div>
    </main>
  );
}
