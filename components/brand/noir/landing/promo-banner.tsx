import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function PromoBannerSection() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 items-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-heading)]">
            The Dark Collection
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-lg">
            Koleksi eksklusif dengan palet gelap dan siluet tegas. Edisi terbatas.
          </p>
          <Link
            href="/products"
            className={buttonVariants({ size: "lg", variant: "secondary" })}
          >
            Belanja Sekarang
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
