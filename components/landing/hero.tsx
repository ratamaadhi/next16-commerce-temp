"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, ShieldCheck, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { EASE, motionAllowed } from "./motion";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.enter } });

      tl.from(".hero-blur", { opacity: 0, scale: 0.95, duration: 1.2 }, 0)
        .from(".hero-badge", { opacity: 0, y: -16, duration: 0.6 }, 0.1)
        .from(
          ".hero-headline",
          { clipPath: "inset(0 100% 0 0)", duration: 0.9, ease: EASE.decisive },
          0.2,
        )
        .from(".hero-sub", { opacity: 0, y: 18, duration: 0.6 }, 0.5)
        .from(".hero-cta", { opacity: 0, y: 18, duration: 0.5, stagger: 0.12 }, 0.7)
        .from(".hero-stat", { opacity: 0, y: 22, duration: 0.5, stagger: 0.1 }, 0.9);

      gsap.to(".hero-blur-tr", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
      gsap.to(".hero-blur-bl", {
        yPercent: -22,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden bg-background"
    >
      <div className="hero-blur hero-blur-tr absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="hero-blur hero-blur-bl absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/30" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative z-10 py-16 sm:py-20 md:py-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-4 sm:gap-6 md:gap-8">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Preloved Beauty Pilihan</span>
          </div>

          <h1 className="hero-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-foreground">
            <span className="block text-primary">Cyra&apos;s</span>
            <span className="block italic font-medium">Preloved</span>
          </h1>

          <p className="hero-sub text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            100% asli, terpilih dengan cinta, harga spesial. Koleksi pribadi Cyra untuk Anda yang
            mengutamakan kualitas.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/products"
              className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
            >
              Lihat Koleksi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/categories"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "w-full sm:w-auto",
              })}
            >
              Jelajahi Kategori
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-2 sm:pt-4">
            {[
              { icon: ShieldCheck, label: "100% Asli", sub: "Produk Original" },
              { icon: Heart, label: "Terkurasi", sub: "Oleh Cyra" },
              { icon: ShoppingBag, label: "Preloved", sub: "Berkualitas" },
            ].map((stat, i) => (
              <div key={i} className="hero-stat flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <span className="block text-xs sm:text-sm font-semibold text-foreground">
                    {stat.label}
                  </span>
                  <span className="block text-[10px] sm:text-xs text-muted-foreground">
                    {stat.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
