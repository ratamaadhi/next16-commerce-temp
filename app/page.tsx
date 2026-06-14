import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getFeaturedProducts, type ProductData } from "@/lib/products";
import { getCategories, type CategoryData } from "@/lib/categories";
import { ProductGrid } from "@/components/products/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { BrandId } from "@/types/brand";
import { brandConfigs } from "@/lib/brand-config";

import { HeroSection as CyraHero } from "@/components/brand/cyra/landing/hero";
import { WhyCyraSection } from "@/components/brand/cyra/landing/why-cyra";
import { CategoriesSection as CyraCategories } from "@/components/brand/cyra/landing/categories";
import { TestimonialsSection as CyraTestimonials } from "@/components/brand/cyra/landing/testimonials";
import { PromoBannerSection as CyraPromo } from "@/components/brand/cyra/landing/promo-banner";
import { FadeInSection } from "@/components/brand/cyra/landing/section-animation";

import { HeroSection as LuminaHero } from "@/components/brand/lumina/landing/hero";
import { CategoriesSection as LuminaCategories } from "@/components/brand/lumina/landing/categories";
import { TestimonialsSection as LuminaTestimonials } from "@/components/brand/lumina/landing/testimonials";
import { PromoBannerSection as LuminaPromo } from "@/components/brand/lumina/landing/promo-banner";

import { HeroSection as NoirHero } from "@/components/brand/noir/landing/hero";
import { TestimonialsSection as NoirTestimonials } from "@/components/brand/noir/landing/testimonials";
import { PromoBannerSection as NoirPromo } from "@/components/brand/noir/landing/promo-banner";

type SectionMap = {
  Hero: () => React.ReactNode;
  Why?: () => React.ReactNode;
  Categories?: (props: { categories: CategoryData[] }) => React.ReactNode;
  Testimonials?: () => React.ReactNode;
  Promo?: () => React.ReactNode;
};

const sections: Record<BrandId, SectionMap> = {
  cyra: {
    Hero: () => <CyraHero />,
    Why: () => <WhyCyraSection />,
    Categories: ({ categories }: { categories: CategoryData[] }) => (
      <CyraCategories categories={categories} />
    ),
    Testimonials: () => <CyraTestimonials />,
    Promo: () => <CyraPromo />,
  },
  lumina: {
    Hero: () => <LuminaHero />,
    Categories: ({ categories }: { categories: CategoryData[] }) => (
      <LuminaCategories categories={categories} />
    ),
    Testimonials: () => <LuminaTestimonials />,
    Promo: () => <LuminaPromo />,
  },
  noir: {
    Hero: () => <NoirHero />,
    Testimonials: () => <NoirTestimonials />,
    Promo: () => <NoirPromo />,
  },
};

export default async function HomePage() {
  const headersList = await headers();
  const rawBrand = headersList.get("x-brand-id") || "cyra";
  const brand: BrandId =
    rawBrand in brandConfigs ? (rawBrand as BrandId) : "cyra";

  let featuredProducts: ProductData[] = [];
  try {
    const response = await getFeaturedProducts();
    featuredProducts = response.data;
  } catch {
    featuredProducts = [];
  }

  let categories: CategoryData[] = [];
  try {
    const catResponse = await getCategories();
    categories = catResponse.data;
  } catch {
    categories = [];
  }

  const S = sections[brand];

  return (
    <main className="flex flex-col">
      <S.Hero />

      {S.Why?.()}

      {S.Categories && <S.Categories categories={categories} />}

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
                    Pilihan terbaik dari koleksi {brandConfigs[brand].name}
                  </p>
                </div>
                <Link
                  href="/products"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <ProductGrid products={featuredProducts} />
            </div>
          </section>
        </FadeInSection>
      )}

      {S.Testimonials?.()}

      {S.Promo?.()}
    </main>
  );
}
