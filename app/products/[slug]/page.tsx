import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { ProductImages } from "@/components/products/product-images";
import { ProductActions } from "@/components/products/product-actions";
import { SpecificationsTable } from "@/components/products/specifications-table";
import { ReviewSection } from "@/components/reviews/review-section";
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ProductImages images={product.images ?? []} productName={product.name} />

        <ProductActions product={product} variants={variants} />
      </div>

      {product.description && (
        <div className="mt-8 prose max-w-none">
          <h2 className="text-lg font-semibold mb-2">Deskripsi</h2>
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
      )}

      {specifications.length > 0 && (
        <div className="mt-8">
          <SpecificationsTable specifications={specifications} />
        </div>
      )}

      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection />
      </div>
    </main>
  );
}
