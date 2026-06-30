import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { ProductImages } from "@/components/products/product-images";
import { ProductActions } from "@/components/products/product-actions";
import { SpecificationsTable } from "@/components/products/specifications-table";
import { ReviewSection } from "@/components/reviews/review-section";
import type { ReviewItem } from "@/lib/reviews";
import ReactMarkdown from "react-markdown";
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
  const reviews = (product.reviews ?? []) as ReviewItem[];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start">
        <ProductImages images={product.images ?? []} productName={product.name} />

        <div className="md:sticky md:top-24">
          <ProductActions product={product} variants={variants} />
        </div>
      </div>

      {product.description && (
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight text-foreground">
            Deskripsi
          </h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        </section>
      )}

      {specifications.length > 0 && (
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight text-foreground">
            Spesifikasi
          </h2>
          <SpecificationsTable specifications={specifications} />
        </section>
      )}

      <section className="mt-12 border-t border-border pt-10">
        <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight text-foreground">
          Ulasan
        </h2>
        <ReviewSection reviews={reviews} />
      </section>
    </main>
  );
}
