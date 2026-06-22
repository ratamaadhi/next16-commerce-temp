"use client"

import { useLayoutEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { buttonVariants } from "@/components/ui/button"
import { ShieldCheck, ShoppingBag, Sparkles, Gem } from "lucide-react"
import { EASE, motionAllowed } from "./motion"

gsap.registerPlugin(ScrollTrigger)

export function PromoBannerSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!sectionRef.current || !motionAllowed()) return

    const ctx = gsap.context(() => {
      gsap.to(".promo-shape-1", {
        y: 14,
        rotation: 4,
        duration: 6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      })
      gsap.to(".promo-shape-2", {
        y: -10,
        duration: 5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      })
      gsap.to(".promo-shape-3", {
        y: 8,
        rotation: -6,
        duration: 7,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      })
      gsap.to(".promo-shape-4", {
        y: -7,
        rotation: 8,
        duration: 4.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".promo-content", start: "top 82%", toggleActions: "play none none none" },
      })
      tl.from(".promo-icon", {
        scale: 0,
        rotation: -20,
        opacity: 0,
        duration: 0.7,
        ease: EASE.decisive,
      })
        .from(".promo-badge", { opacity: 0, y: 12, duration: 0.5, ease: EASE.enter }, "-=0.4")
        .from(".promo-headline", { opacity: 0, y: 18, duration: 0.6, ease: EASE.enter }, "-=0.3")
        .from(".promo-text", { opacity: 0, y: 12, duration: 0.5, ease: EASE.enter }, "-=0.4")
        .from(".promo-cta", { opacity: 0, y: 12, duration: 0.5, ease: EASE.enter }, "-=0.3")
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24 overflow-hidden bg-[linear-gradient(135deg,var(--primary)_0%,#c49466_100%)] dark:bg-card"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <Sparkles className="promo-shape-1 absolute -top-6 -left-6 md:-top-10 md:-left-10 h-20 w-20 md:h-32 md:w-32 text-foreground/[0.07]" />
        <Sparkles className="promo-shape-2 absolute top-1/4 right-10 h-12 w-12 md:h-16 md:w-16 text-foreground/[0.07]" />
        <Gem className="promo-shape-3 absolute bottom-10 left-1/4 h-10 w-10 md:h-14 md:w-14 text-foreground/[0.07]" />
        <Sparkles className="promo-shape-4 absolute top-1/3 left-1/3 h-6 w-6 md:h-8 md:w-8 text-foreground/[0.07]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="promo-content flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
          <div className="promo-icon w-16 h-16 rounded-2xl bg-foreground/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-foreground" aria-hidden="true" />
          </div>

          <div className="promo-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/[0.08] text-foreground text-sm font-medium">
            <span>Garansi Keaslian 100%</span>
          </div>

          <h2 className="promo-headline text-4xl sm:text-5xl md:text-6xl font-bold italic text-foreground [text-wrap:balance]">
            100% Produk Original
          </h2>

          <p className="promo-text text-foreground/90 text-lg max-w-xl leading-relaxed [text-wrap:pretty]">
            Setiap produk dijamin asli dan sudah melalui pemeriksaan langsung oleh Cyra. Belanja
            dengan tenang dan percaya diri.
          </p>

          <Link
            href="/products"
            className={buttonVariants({ size: "lg", variant: "secondary" }) + " promo-cta mt-2"}
          >
            <ShoppingBag className="mr-2 h-5 w-5" aria-hidden="true" />
            Belanja Sekarang
          </Link>
        </div>
      </div>
    </section>
  )
}
