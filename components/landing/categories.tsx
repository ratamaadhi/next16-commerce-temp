"use client"

import { useLayoutEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { buttonVariants } from "@/components/ui/button"
import {
  ArrowRight,
  ShoppingBag,
  Shirt,
  Footprints,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react"
import type { CategoryData } from "@/lib/categories"

gsap.registerPlugin(ScrollTrigger)

const iconMap: Record<string, LucideIcon> = {
  Tas: ShoppingBag,
  Baju: Shirt,
  Sepatu: Footprints,
  Makeup: Sparkles,
  Kecantikan: Sparkles,
  Skincare: Sparkles,
  Dress: Shirt,
  Atasan: Shirt,
  Bawahan: Shirt,
}

function getCategoryIcon(name: string): LucideIcon {
  return iconMap[name] ?? Tag
}

interface CategoriesSectionProps {
  categories: CategoryData[]
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".cat-header", { opacity: 0, y: 30 })
      gsap.set(".cat-card", { opacity: 0, y: 40, scale: 0.95 })

      gsap.to(".cat-header", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cat-header", start: "top 80%", toggleActions: "play none none none" },
      })
      gsap.to(".cat-card", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: ".cat-card", start: "top 85%", toggleActions: "play none none none" },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [categories])

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="cat-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0 mb-8 sm:mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">
              Jelajahi Kategori
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">Temukan produk sesuai kebutuhanmu</p>
          </div>
          <Link
            href="/categories"
            className={buttonVariants({ variant: "ghost" }) + " hidden md:inline-flex"}
          >
            Lihat Semua
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name)
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="cat-card group flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  style={{ willChange: "transform, opacity" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-center">
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Belum ada kategori tersedia.
          </p>
        )}

        <Link
          href="/categories"
          className={buttonVariants({ variant: "ghost" }) + " mt-8 mx-auto w-fit md:hidden"}
        >
          Lihat Semua
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
