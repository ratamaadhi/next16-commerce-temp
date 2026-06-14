"use client"

import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ShieldCheck, Heart, ShoppingBag } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const values = [
  {
    icon: ShieldCheck,
    title: "100% Asli & Terjamin",
    desc: "Semua produk adalah original dari brand ternama. Tidak ada barang palsu atau kw.",
    size: "large" as const,
  },
  {
    icon: Heart,
    title: "Dikurasi dengan Cinta",
    desc: "Cyra memeriksa setiap produk secara pribadi. Hanya yang berkualitas baik yang dijual.",
    size: "small" as const,
  },
  {
    icon: ShoppingBag,
    title: "Harga Spesial",
    desc: "Dapatkan produk kecantikan premium dengan harga jauh lebih terjangkau dari harga baru.",
    size: "small" as const,
  },
]

export function WhyCyraSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".why-title", { opacity: 0, y: 40 })
      gsap.set(".why-card", { opacity: 0, y: 60 })

      gsap.to(".why-title", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".why-title", start: "top 80%", toggleActions: "play none none none" },
      })
      gsap.to(".why-card", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ".why-card", start: "top 85%", toggleActions: "play none none none" },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="why-title text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Kenapa <span className="text-primary">Cyra</span>?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Setiap produk yang dijual adalah hasil kurasi pribadi. Cyra hanya membagikan yang terbaik
            dari koleksinya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {values.map((item, i) => (
            <div
              key={i}
              className={`why-card group bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 sm:p-8 ${
                item.size === "large" ? "md:col-span-2 md:row-span-2 md:p-10" : "md:col-span-2"
              }`}
              style={{ willChange: "transform, opacity" }}
            >
              <div
                className={`rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors ${
                  item.size === "large" ? "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" : "w-10 h-10 sm:w-12 sm:h-12"
                }`}
              >
                <item.icon
                  className={`text-primary transition-transform duration-300 group-hover:scale-110 ${
                    item.size === "large" ? "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" : "h-5 w-5 sm:h-6 sm:w-6"
                  }`}
                />
              </div>
              <h3
                className={`font-semibold text-foreground mb-3 group-hover:text-primary transition-colors ${
                  item.size === "large" ? "text-2xl" : "text-xl"
                }`}
              >
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
