import Link from "next/link";
import { getFeaturedProducts, type ProductData } from "@/lib/products";
import { getCategories, type CategoryData } from "@/lib/categories";
import { ProductGrid } from "@/components/products/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/landing/hero";
import { WhyCyraSection } from "@/components/landing/why-cyra";
import { CategoriesSection } from "@/components/landing/categories";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { PromoBannerSection } from "@/components/landing/promo-banner";
import { FadeInSection } from "@/components/landing/section-animation";

export default async function HomePage() {
  const [featuredResult, categoriesResult] = await Promise.allSettled([
    getFeaturedProducts(),
    getCategories(),
  ]);

  const featuredProducts: ProductData[] =
    featuredResult.status === "fulfilled" ? featuredResult.value.data : [];
  const categories: CategoryData[] =
    categoriesResult.status === "fulfilled" ? categoriesResult.value.data : [];

  return (
    <main className="flex flex-col">
      <HeroSection />

      <WhyCyraSection />

      <CategoriesSection categories={categories} />

      {featuredProducts.length > 0 && (
        <FadeInSection>
          <section className="py-16 sm:py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-8 sm:mb-12">
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">
                    Produk Unggulan
                  </h2>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Pilihan terbaik dari koleksi Cyra
                  </p>
                </div>
                <Link href="/products" className={buttonVariants({ variant: "outline" })}>
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <ProductGrid products={featuredProducts} />
            </div>
          </section>
        </FadeInSection>
      )}

      <TestimonialsSection />

      <PromoBannerSection />
    </main>
  );
}
