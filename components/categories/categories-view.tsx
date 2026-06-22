"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Baby,
  Footprints,
  Gem,
  Heart,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EASE, motionAllowed } from "@/components/landing/motion";
import { getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import type { CategoryData } from "@/lib/categories";

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, LucideIcon> = {
  aksesoris: Gem,
  atasan: Shirt,
  bawahan: Shirt,
  bayi: Baby,
  ibu: Heart,
  outerwear: Shirt,
  pakaian: Shirt,
  perawatan: Sparkles,
  perlengkapan: ShoppingBag,
  popok: Baby,
  preloved: Sparkles,
  pria: User,
  sepatu: Footprints,
  tas: ShoppingBag,
  wanita: Heart,
  jam: Watch,
  Tas: ShoppingBag,
  Baju: Shirt,
  Sepatu: Footprints,
  Makeup: Sparkles,
  Kecantikan: Sparkles,
  Skincare: Sparkles,
  Dress: Shirt,
  Atasan: Shirt,
  Bawahan: Shirt,
};

function getCategoryIcon(name: string): LucideIcon {
  return iconMap[name] ?? iconMap[name.toLowerCase()] ?? Tag;
}

interface CategoriesViewProps {
  categories: CategoryData[];
}

export function CategoriesView({ categories }: CategoriesViewProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current || !motionAllowed()) return;
    if (categories.length === 0) return;

    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: EASE.enter } });
      heroTl
        .from(".cat-hero-badge", { opacity: 0, y: -16, duration: 0.6 }, 0.1)
        .from(
          ".cat-hero-headline",
          { clipPath: "inset(0 100% 0 0)", duration: 0.9, ease: EASE.decisive },
          0.2,
        )
        .from(".cat-hero-sub", { opacity: 0, y: 18, duration: 0.6 }, 0.5);

      const cards = gsap.utils.toArray<HTMLElement>(".cat-card");
      cards.forEach((card) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
        tl.from(card, {
          clipPath: "inset(0 0 100% 0)",
          immediateRender: false,
          duration: 0.75,
          ease: EASE.decisive,
        })
          .from(
            card.querySelector(".cat-card-media"),
            {
              scale: 0.9,
              immediateRender: false,
              duration: 0.55,
              ease: EASE.snap,
            },
            "-=0.45",
          )
          .from(
            card.querySelector(".cat-card-name"),
            {
              opacity: 0,
              y: 12,
              immediateRender: false,
              duration: 0.4,
              ease: EASE.enter,
            },
            "-=0.3",
          )
          .from(
            card.querySelector(".cat-card-desc"),
            {
              opacity: 0,
              y: 10,
              immediateRender: false,
              duration: 0.35,
              ease: EASE.enter,
            },
            "-=0.2",
          )
          .from(
            card.querySelector(".cat-card-cta"),
            {
              opacity: 0,
              y: 8,
              immediateRender: false,
              duration: 0.35,
              ease: EASE.enter,
            },
            "-=0.15",
          );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [categories.length]);

  const hasCategories = categories.length > 0;

  return (
    <div ref={sectionRef} className="flex flex-col">
      <section className="relative overflow-hidden bg-background">
        <div
          className="hero-blur absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="hero-blur absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/30"
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 relative z-10 py-16 sm:py-20 md:py-28">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-5 sm:gap-6">
            <div className="cat-hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>Kurasi Pilihan untuk Anda</span>
            </div>

            <h1 className="cat-hero-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-foreground">
              <span className="block text-primary italic font-medium">Jelajahi</span>
              <span className="block">Kategori</span>
            </h1>

            <p className="cat-hero-sub text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed [text-wrap:pretty]">
              Setiap kategori dipilih dengan cermat. Temukan koleksi preloved sesuai dengan
              kebutuhan dan gaya Anda.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          {hasCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.name);
                const hasImage = Boolean(cat.image?.url);
                return (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className={cn(
                      "cat-card group relative flex flex-col bg-card rounded-2xl overflow-hidden",
                      "border border-border/50 shadow-sm",
                      "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1",
                      "transition-all duration-300 ease-out",
                    )}
                  >
                    <div className="cat-card-media relative aspect-[4/3] overflow-hidden bg-secondary/50">
                      {hasImage ? (
                        <Image
                          src={getStrapiMedia(cat.image!.url)}
                          alt={cat.image?.alternativeText || cat.name}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/50 to-accent/10">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <Icon
                              className="h-8 w-8 sm:h-10 sm:w-10 text-primary"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      )}

                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex flex-col flex-1 p-5 sm:p-6">
                      <h2 className="cat-card-name font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {cat.name}
                      </h2>
                      {cat.description && (
                        <p className="cat-card-desc text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-2 mb-5 flex-1">
                          {cat.description}
                        </p>
                      )}
                      <span className="cat-card-cta inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                        Lihat Koleksi
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-12">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-secondary flex items-center justify-center">
                <Tag className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-playfair)] text-foreground mb-2">
                Belum Ada Kategori
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kategori akan segera tersedia. Sementara itu, Anda dapat melihat semua produk
                pilihan kami.
              </p>
              <Link
                href="/products"
                className={buttonVariants({ className: "mt-6" })}
              >
                Lihat Semua Produk
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
