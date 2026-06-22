"use client"

import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { EASE, motionAllowed } from "./motion"

gsap.registerPlugin(ScrollTrigger)

const values = [
  {
    label: "Garansi",
    title: "100% Asli & Terjamin",
    desc: "Semua produk adalah original dari brand ternama. Tidak ada barang palsu atau kw.",
    size: "large" as const,
  },
  {
    label: "Kurasi",
    title: "Dikurasi dengan Cinta",
    desc: "Cyra memeriksa setiap produk secara pribadi. Hanya yang berkualitas baik yang dijual.",
    size: "small" as const,
  },
  {
    label: "Harga",
    title: "Harga Spesial",
    desc: "Dapatkan produk kecantikan premium dengan harga jauh lebih terjangkau dari harga baru.",
    size: "small" as const,
  },
]

export function WhyCyraSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!sectionRef.current || !motionAllowed()) return

    const ctx = gsap.context(() => {
      // Title: h2 and p enter separately; brand name gets its own pop
      const titleTl = gsap.timeline({
        scrollTrigger: { trigger: ".why-title", start: "top 82%", toggleActions: "play none none none" },
      })
      titleTl
        .from(".why-title h2", {
          opacity: 0,
          y: 28,
          immediateRender: false,
          duration: 0.65,
          ease: EASE.enter,
        })
        .from(
          ".why-title-brand",
          {
            scale: 0.82,
            immediateRender: false,
            duration: 0.45,
            ease: EASE.decisive,
          },
          "-=0.45"
        )
        .from(
          ".why-title p",
          {
            opacity: 0,
            y: 16,
            immediateRender: false,
            duration: 0.5,
            ease: EASE.enter,
          },
          "-=0.3"
        )

      // Feature card: top-down wipe (like unveiling a certificate) → cascade mark → heading → text
      const featureTl = gsap.timeline({
        scrollTrigger: { trigger: ".why-card--feature", start: "top 80%", toggleActions: "play none none none" },
      })
      featureTl
        .from(".why-card--feature", {
          clipPath: "inset(0 0 100% 0)",
          immediateRender: false,
          duration: 0.85,
          ease: EASE.decisive,
        })
        .from(
          ".why-card--feature .why-mark",
          { opacity: 0, y: 8, immediateRender: false, duration: 0.45, ease: EASE.enter },
          "-=0.45"
        )
        .from(
          ".why-card--feature h3",
          { opacity: 0, y: 14, immediateRender: false, duration: 0.4, ease: EASE.enter },
          "-=0.2"
        )
        .from(
          ".why-card--feature p",
          { opacity: 0, y: 10, immediateRender: false, duration: 0.35, ease: EASE.enter },
          "-=0.2"
        )

      // Regular cards: same wipe + cascade pattern
      const regularCards = gsap.utils.toArray<HTMLElement>(".why-card--regular")

      regularCards.forEach((card) => {
        const cardTl = gsap.timeline({
          scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none none" },
        })
        cardTl
          .from(card, { clipPath: "inset(0 0 100% 0)", immediateRender: false, duration: 0.75, ease: EASE.decisive })
          .from(
            card.querySelector(".why-mark"),
            { opacity: 0, y: 8, immediateRender: false, duration: 0.4, ease: EASE.enter },
            "-=0.4"
          )
          .from(card.querySelector("h3"), { opacity: 0, y: 14, immediateRender: false, duration: 0.4, ease: EASE.enter }, "-=0.2")
          .from(card.querySelector("p"), { opacity: 0, y: 10, immediateRender: false, duration: 0.35, ease: EASE.enter }, "-=0.2")
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="why-title text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-foreground [text-wrap:balance]">
            Kenapa{" "}
            <span className="why-title-brand text-primary inline-block italic font-medium">Cyra</span>
            ?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg [text-wrap:pretty]">
            Setiap produk yang dijual adalah hasil kurasi pribadi. Cyra hanya membagikan yang terbaik
            dari koleksinya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {values.map((item, i) => {
            const large = item.size === "large"
            return (
              <div
                key={i}
                className={`why-card group bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 sm:p-8 ${
                  large
                    ? "why-card--feature md:col-span-2 md:row-span-2 md:p-10"
                    : "why-card--regular md:col-span-2"
                }`}
              >
                <div
                  className={`why-mark flex items-center gap-3 sm:gap-4 ${
                    large ? "mb-7 sm:mb-9" : "mb-5 sm:mb-6"
                  }`}
                >
                  <span
                    className={`block h-px bg-primary/40 transition-colors duration-300 group-hover:bg-primary/70 ${
                      large ? "w-16 sm:w-24" : "w-10 sm:w-12"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`italic text-primary ${large ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {item.label}
                  </span>
                </div>
                <h3
                  className={`font-semibold text-foreground mb-3 group-hover:text-primary transition-colors ${
                    large ? "text-2xl" : "text-xl"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
