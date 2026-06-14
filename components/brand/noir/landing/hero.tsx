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
      gsap.from(".hero-headline", { opacity: 0, y: 60, duration: 1, ease: "power4.out" })
      gsap.from(".hero-sub", { opacity: 0, y: 40, duration: 0.8, delay: 0.3, ease: "power4.out" })
      gsap.from(".hero-cta", { opacity: 0, y: 30, duration: 0.6, delay: 0.6, ease: "power4.out" })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="aspect-square w-full h-full bg-secondary" />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24 sm:py-32 md:py-40 flex flex-col items-center text-center">
        <h1 className="hero-headline text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-none mb-6 tracking-tight font-[family-name:var(--font-heading)]">
          Elegance in Darkness
        </h1>

        <p className="hero-sub text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-8">
          Koleksi eksklusif dengan karakter tegas dan estetika yang tak lekang oleh waktu.
        </p>

        <div className="hero-cta">
          <Link
            href="/products"
            className={buttonVariants({ size: "lg" })}
          >
            Jelajahi Koleksi
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}