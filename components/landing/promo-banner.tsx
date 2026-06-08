"use client"

import { useLayoutEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { buttonVariants } from "@/components/ui/button"
import { ShieldCheck, ShoppingBag, Gift, Sparkles, Gem } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export function PromoBannerSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".promo-content", { opacity: 0, y: 50 })
      gsap.set(".promo-icon", { opacity: 0, scale: 0.5 })

      gsap.to(".promo-content", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".promo-content", start: "top 80%", toggleActions: "play none none none" },
      })
      gsap.to(".promo-icon", {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(2)",
        scrollTrigger: { trigger: ".promo-icon", start: "top 85%", toggleActions: "play none none none" },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, #c49466 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Gift className="absolute -top-6 -left-6 md:-top-10 md:-left-10 h-20 w-20 md:h-32 md:w-32 text-primary-foreground/10 animate-bounce" />
        <Sparkles className="absolute top-1/4 right-10 h-12 w-12 md:h-16 md:w-16 text-primary-foreground/10" />
        <Gem className="absolute bottom-10 left-1/4 h-10 w-10 md:h-14 md:w-14 text-primary-foreground/10" />
        <Sparkles className="absolute top-1/3 left-1/3 h-6 w-6 md:h-8 md:w-8 text-primary-foreground/10" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="promo-content flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
          <div className="promo-icon w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground/90 text-sm">
            <span>Garansi Keaslian 100%</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
            100% Produk Original
          </h2>

          <p className="text-primary-foreground/80 text-lg max-w-xl leading-relaxed">
            Setiap produk dijamin asli dan sudah melalui pemeriksaan langsung oleh Cyra. Belanja
            dengan tenang dan percaya diri.
          </p>

          <Link
            href="/products"
            className={buttonVariants({ size: "lg", variant: "secondary" }) + " mt-2"}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Belanja Sekarang
          </Link>
        </div>
      </div>
    </section>
  )
}
