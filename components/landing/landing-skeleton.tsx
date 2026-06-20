import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Sparkles, Gift, Gem } from "lucide-react";

export function HeroSkeleton() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/30" />
      <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative z-10 py-16 sm:py-20 md:py-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-4 sm:gap-6 md:gap-8">
          <Skeleton className="h-7 w-44 rounded-full" />

          <Skeleton className="h-12 sm:h-16 md:h-20 w-3/4 max-w-3xl" />

          <Skeleton className="h-5 w-2/3 max-w-2xl" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Skeleton className="h-11 w-full sm:w-40" />
            <Skeleton className="h-11 w-full sm:w-40" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-2 sm:pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                <div>
                  <Skeleton className="h-3.5 w-20 mb-1.5" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhyCyraSkeleton() {
  return (
    <section className="py-20 md:py-28 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <Skeleton className="h-10 w-72 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 max-w-2xl mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="md:col-span-2 md:row-span-2 bg-card rounded-2xl border border-border/50 p-6 sm:p-8 md:p-10">
            <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl mb-4 sm:mb-6" />
            <Skeleton className="h-7 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="md:col-span-2 bg-card rounded-2xl border border-border/50 p-6 sm:p-8">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl mb-4 sm:mb-6" />
            <Skeleton className="h-6 w-2/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="md:col-span-2 bg-card rounded-2xl border border-border/50 p-6 sm:p-8">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl mb-4 sm:mb-6" />
            <Skeleton className="h-6 w-2/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoriesSkeleton() {
  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0 mb-8 sm:mb-12">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-9 w-32 hidden md:block" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 rounded-2xl bg-card border border-border/50"
            >
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <section className="py-16 sm:py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-8 sm:mb-12">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <ProductGridSkeleton count={8} />
      </div>
    </section>
  );
}

export function TestimonialsSkeleton() {
  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <Skeleton className="h-10 w-72 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 max-w-2xl mx-auto" />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl p-8 md:p-10 border border-border/50 shadow-sm text-center">
            <div className="flex justify-center gap-1 mb-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-5 rounded-sm" />
              ))}
            </div>

            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-2/3 mx-auto mb-8" />

            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3" />

            <Skeleton className="h-4 w-24 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <Skeleton className="h-2.5 w-6 rounded-full" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PromoBannerSkeleton() {
  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, #c49466 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Gift className="absolute -top-6 -left-6 md:-top-10 md:-left-10 h-20 w-20 md:h-32 md:w-32 text-primary-foreground/10" />
        <Sparkles className="absolute top-1/4 right-10 h-12 w-12 md:h-16 md:w-16 text-primary-foreground/10" />
        <Gem className="absolute bottom-10 left-1/4 h-10 w-10 md:h-14 md:w-14 text-primary-foreground/10" />
        <Sparkles className="absolute top-1/3 left-1/3 h-6 w-6 md:h-8 md:w-8 text-primary-foreground/10" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
          <Skeleton className="h-16 w-16 rounded-2xl bg-primary-foreground/20" />

          <Skeleton className="h-7 w-44 rounded-full bg-primary-foreground/20" />

          <Skeleton className="h-10 w-72 bg-primary-foreground/20" />

          <Skeleton className="h-5 w-full max-w-xl bg-primary-foreground/15" />
          <Skeleton className="h-5 w-3/4 max-w-xl bg-primary-foreground/15" />

          <Skeleton className="h-11 w-44 bg-primary-foreground/30" />
        </div>
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <WhyCyraSkeleton />
      <CategoriesSkeleton />
      <FeaturedProductsSkeleton />
      <TestimonialsSkeleton />
      <PromoBannerSkeleton />
    </>
  );
}
