"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { EASE, motionAllowed } from "./motion"

gsap.registerPlugin(ScrollTrigger)

interface FadeInSectionProps {
  children: ReactNode
  className?: string
}

export function FadeInSection({ children, className }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current || !motionAllowed()) return

    const ctx = gsap.context(() => {
      gsap.set(ref.current, { opacity: 0, y: 40 })
      gsap.to(ref.current, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: EASE.enter,
        scrollTrigger: { trigger: ref.current, start: "top 82%", toggleActions: "play none none none" },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
