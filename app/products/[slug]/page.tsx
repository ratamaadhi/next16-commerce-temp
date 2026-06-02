import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { ProductImages } from "@/components/products/product-images";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { SpecificationsTable } from "@/components/products/specifications-table";
import { ReviewSection } from "@/components/reviews/review-section";
import { formatPrice } from "@/lib/strapi";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const response = await getProductBySlug(slug);
  const product = response.data?.[0];

  if (!product) return { title: "Produk Tidak Ditemukan" };

  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const response = await getProductBySlug(slug);
  const product = response.data?.[0];

  if (!product) notFound();

  const variants = product.variants ?? [];
  const specifications = product.specifications ?? [];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ProductImages images={product.images ?? []} productName={product.name} />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {variants.length > 0 && <VariantSelector variants={variants} />}

          <AddToCartButton
            productId={product.id}
            productName={product.name}
            price={product.price}
            image={product.images?.[0]?.url}
            disabled={(product.inventory ?? 0) <= 0}
          />

          {product.description && (
            <div className="prose max-w-none pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">Deskripsi</h2>
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          {specifications.length > 0 && (
            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">Spesifikasi</h2>
              <SpecificationsTable specifications={specifications} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection />
      </div>
    </main>
  );
}
