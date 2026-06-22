import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export const EASE = {
  enter: "power3.out",
  snap: "power2.out",
  decisive: "expo.out",
} as const

export function motionAllowed(): boolean {
  if (typeof window === "undefined") return false
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
