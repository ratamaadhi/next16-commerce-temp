"use client"

import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Star, Pause, Play } from "lucide-react"
import { EASE, motionAllowed } from "./motion"

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    name: "Dina",
    role: "Teman Cyra",
    text: "Aku udah coba beberapa produk preloved dari Cyra. Kondisinya masih bagus banget, dan harganya jauh lebih terjangkau. Recommended!",
    rating: 5,
  },
  {
    name: "Rina",
    role: "Sahabat",
    text: "Cyra memang teliti banget dalam memilih produk. Aku percaya karena ini langsung dari koleksi pribadinya. Belanja di sini bikin hemat tanpa takut barang palsu.",
    rating: 5,
  },
  {
    name: "Mira",
    role: "Teman Dekat",
    text: "Senang banget bisa beli produk kecantikan preloved yang trusted. Cyra selalu jujur soal kondisi barangnya. Pengiriman juga cepat!",
    rating: 5,
  },
]

const AUTO_ROTATE_MS = 5000

const playPauseButtonClass =
  "h-11 w-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.96] transition-all"

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const onCarouselMouseEnter = useCallback(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(hover: hover)").matches) {
      setIsHovered(true)
    }
  }, [])
  const onCarouselMouseLeave = useCallback(() => setIsHovered(false), [])

  useEffect(() => {
    if (!api || isPaused || isHovered) return
    if (!motionAllowed()) return
    const interval = setInterval(() => {
      api.scrollNext()
    }, AUTO_ROTATE_MS)
    return () => clearInterval(interval)
  }, [api, isPaused, isHovered])

  const onSelect = useCallback(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
  }, [api])

  useEffect(() => {
    if (!api) return
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  useLayoutEffect(() => {
    if (!sectionRef.current || !motionAllowed()) return

    const ctx = gsap.context(() => {
      gsap.from(".testi-title", {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: EASE.enter,
        scrollTrigger: { trigger: ".testi-title", start: "top 82%", toggleActions: "play none none none" },
      })
      gsap.from(".testi-subtitle", {
        opacity: 0,
        y: 18,
        duration: 0.6,
        delay: 0.1,
        ease: EASE.enter,
        scrollTrigger: { trigger: ".testi-subtitle", start: "top 85%", toggleActions: "play none none none" },
      })

      gsap.set(".testi-carousel", { opacity: 0, y: 30 })
      gsap.to(".testi-carousel", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: 0.15,
        ease: EASE.enter,
        scrollTrigger: { trigger: ".testi-carousel", start: "top 82%", toggleActions: "play none none none" },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="testi-title text-2xl sm:text-3xl md:text-4xl font-semibold italic mb-4 text-foreground [text-wrap:balance]">
            Apa Kata <span className="text-primary not-italic">Mereka</span>?
          </h2>
          <p className="testi-subtitle text-muted-foreground text-lg">
            Testimoni dari teman-teman yang sudah mencoba produk preloved dari Cyra.
          </p>
        </div>

        <div
          className="testi-carousel max-w-2xl mx-auto"
          onMouseEnter={onCarouselMouseEnter}
          onMouseLeave={onCarouselMouseLeave}
        >
          <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
            <CarouselContent>
              {testimonials.map((t, i) => (
                <CarouselItem key={i}>
                  <div className="bg-card rounded-2xl p-8 md:p-10 border border-border/50 shadow-sm text-center">
                    <div className="flex justify-center gap-1 mb-5" aria-label={`Rating ${t.rating} dari 5`} role="img">
                      {Array.from({ length: t.rating }).map((_, r) => (
                        <Star key={r} className="h-5 w-5 fill-primary text-primary" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-foreground leading-relaxed mb-8 italic text-lg">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <Avatar className="w-12 h-12 mx-auto mb-3">
                      <AvatarFallback className="bg-primary text-foreground font-semibold text-sm">
                        {t.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2" role="tablist" aria-label="Navigasi testimoni">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => api?.scrollTo(i)}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Lihat testimoni ${i + 1} dari ${testimonials.length}`}
                  className={`h-2.5 rounded-full transition-all duration-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    i === current
                      ? "bg-primary w-6"
                      : "bg-primary/30 w-2.5 hover:bg-primary/50"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              aria-label={isPaused ? "Lanjutkan rotasi testimoni" : "Jeda rotasi testimoni"}
              aria-pressed={isPaused}
              className={`md:hidden ${playPauseButtonClass}`}
            >
              {isPaused ? (
                <Play className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pause className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Testimoni {current + 1} dari {testimonials.length}: {testimonials[current].name}, {testimonials[current].role}
          </div>
        </div>
      </div>
    </section>
  )
}
