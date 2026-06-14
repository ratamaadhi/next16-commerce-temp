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
import { Star } from "lucide-react"

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

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const interval = setInterval(() => {
      api.scrollNext()
    }, 4000)
    return () => clearInterval(interval)
  }, [api])

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
    const ctx = gsap.context(() => {
      gsap.set(".testi-header", { opacity: 0, y: 30 })
      gsap.set(".testi-carousel", { opacity: 0, y: 40 })

      gsap.to(".testi-header", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".testi-header", start: "top 80%", toggleActions: "play none none none" },
      })
      gsap.to(".testi-carousel", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ".testi-carousel", start: "top 80%", toggleActions: "play none none none" },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="testi-header text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Apa Kata <span className="text-primary">Mereka</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            Testimoni dari teman-teman yang sudah mencoba produk preloved dari Cyra.
          </p>
        </div>

        <div className="testi-carousel max-w-2xl mx-auto">
          <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
            <CarouselContent>
              {testimonials.map((t, i) => (
                <CarouselItem key={i}>
                  <div className="bg-card rounded-2xl p-8 md:p-10 border border-border/50 shadow-sm text-center">
                    <div className="flex justify-center gap-1 mb-5">
                      {Array.from({ length: t.rating }).map((_, r) => (
                        <Star key={r} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-foreground leading-relaxed mb-8 italic text-lg">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <Avatar className="w-12 h-12 mx-auto mb-3">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
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

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-primary w-6"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
