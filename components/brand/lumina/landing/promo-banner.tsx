import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function PromoBannerSection() {
  return (
    <section className="py-16 md:py-20 bg-primary">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground tracking-tight font-[family-name:var(--font-heading)]">
            Koleksi Baru Telah Hadir
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Produk-produk pilihan dengan desain minimalis dan material premium kini tersedia. Dapatkan sebelum kehabisan.
          </p>
          <div>
            <Link
              href="/products"
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              Belanja Sekarang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
