import Link from "next/link"
import {
  ShoppingBag,
  Shirt,
  Footprints,
  Sparkles,
  Tag,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import type { CategoryData } from "@/lib/categories"

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
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight font-[family-name:var(--font-heading)]">
            Kategori
          </h2>
          <p className="text-muted-foreground text-lg">Temukan produk sesuai kebutuhanmu</p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name)
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center justify-center gap-4 aspect-square bg-muted transition-colors duration-200 hover:bg-muted/80"
                >
                  <Icon className="h-8 w-8 text-foreground/70" />
                  <span className="font-medium text-foreground text-sm">
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
