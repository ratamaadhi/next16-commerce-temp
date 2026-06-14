"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" })
      gsap.from(".hero-sub", { opacity: 0, y: 30, duration: 0.7, delay: 0.2, ease: "power3.out" })
      gsap.from(".hero-cta", { opacity: 0, y: 20, duration: 0.6, delay: 0.4, ease: "power3.out" })
      gsap.from(".hero-image", { opacity: 0, scale: 0.95, duration: 1, delay: 0.3, ease: "power3.out" })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-background overflow-hidden">
      <div className="container mx-auto px-6 py-16 sm:py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="hero-text text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground tracking-tight font-[family-name:var(--font-heading)]">
              Gaya Modern
            </h1>

            <p className="hero-sub text-base sm:text-lg text-muted-foreground leading-relaxed">
              Temukan koleksi pilihan untuk gaya hidup minimalis Anda.
            </p>

            <div className="hero-cta">
              <Link
                href="/products"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Jelajahi Koleksi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="hero-image aspect-square bg-secondary w-full" />
        </div>
      </div>
    </section>
  )
}