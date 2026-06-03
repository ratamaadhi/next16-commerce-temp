import Link from "next/link";
import { getFeaturedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { buttonVariants } from "@/components/ui/button";
import type { ProductData } from "@/lib/products";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Package,
  Star,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

const categories = [
  { slug: "skincare", name: "Skincare", icon: Sparkles },
  { slug: "makeup", name: "Makeup", icon: Heart },
  { slug: "haircare", name: "Haircare", icon: Star },
  { slug: "fragrance", name: "Fragrance", icon: Sparkles },
  { slug: "body-care", name: "Body Care", icon: Heart },
  { slug: "beauty-tools", name: "Beauty Tools", icon: Package },
];

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
];

export default async function HomePage() {
  let featuredProducts: ProductData[] = [];
  try {
    const response = await getFeaturedProducts();
    featuredProducts = response.data;
  } catch {
    featuredProducts = [];
  }

  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="flex flex-col gap-6 max-w-xl animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm w-fit">
                <Sparkles className="h-4 w-4" />
                <span>Preloved Beauty Terkurasi</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Preloved Favorit dari{" "}
                <span className="text-primary">Cyra</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Temukan produk kecantikan berkualitas yang sudah Cyra kurasi
                langsung untukmu. Asli, terjamin, dan dengan harga spesial.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className={buttonVariants({ size: "lg" })}
                >
                  Lihat Koleksi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/categories"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                  })}
                >
                  Jelajahi Kategori
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">100%</span>
                  <span className="text-sm text-muted-foreground">
                    Produk Asli
                  </span>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">
                    Terkurasi
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Oleh Cyra
                  </span>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">
                    Preloved
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Berkualitas
                  </span>
                </div>
              </div>
            </div>

            {/* Illustration Placeholder */}
            <div className="relative flex items-center justify-center animate-fade-in-up animate-delay-200">
              <div className="relative w-full max-w-md aspect-square">
                {/* Decorative circles */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/10 to-secondary/40 rounded-full" />
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-accent/20 rounded-full blur-2xl" />
                {/* Main illustration container */}
                <div className="absolute inset-4 bg-gradient-to-br from-card to-muted rounded-3xl shadow-xl flex items-center justify-center border border-border/50">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Koleksi Cyra
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Produk kecantikan preloved terpilih dengan cinta
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Cyra Section */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Kenapa Preloved dari Cyra?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Setiap produk yang dijual adalah hasil kurasi pribadi. Cyra hanya
              membagikan yang terbaik dari koleksinya.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "100% Asli & Terjamin",
                desc: "Semua produk adalah original dari brand ternama. Tidak ada barang palsu atau kw.",
              },
              {
                icon: Heart,
                title: "Dikurasi dengan Cinta",
                desc: "Cyra memeriksa setiap produk secara pribadi. Hanya yang berkualitas baik yang dijual.",
              },
              {
                icon: ShoppingBag,
                title: "Harga Spesial",
                desc: "Dapatkan produk kecantikan premium dengan harga jauh lebih terjangkau dari harga baru.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Jelajahi Kategori
              </h2>
              <p className="text-muted-foreground">
                Temukan produk sesuai kebutuhanmu
              </p>
            </div>
            <Link
              href="/categories"
              className={buttonVariants({ variant: "ghost" })}
            >
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all animate-fade-in-up"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <cat.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Produk Unggulan
                </h2>
                <p className="text-muted-foreground">
                  Pilihan terbaik dari koleksi Cyra
                </p>
              </div>
              <Link
                href="/products"
                className={buttonVariants({ variant: "outline" })}
              >
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Apa Kata Mereka?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Testimoni dari teman-teman yang sudah mencoba produk preloved dari
              Cyra.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-8 border border-border/50 shadow-sm animate-fade-in-up"
                style={{ animationDelay: `${0.15 * (i + 1)}s` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, r) => (
                    <Star
                      key={r}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-primary-foreground/10 rounded-3xl p-8 md:p-12 border border-primary-foreground/20">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm w-fit mx-auto md:mx-0">
                <ShieldCheck className="h-4 w-4" />
                <span>Garansi Keaslian</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                100% Produk Original
              </h2>
              <p className="text-primary-foreground/80 max-w-xl text-lg">
                Setiap produk dijamin asli dan sudah melalui pemeriksaan
                langsung oleh Cyra. Belanja dengan tenang dan percaya diri.
              </p>
            </div>
            <Link
              href="/products"
              className={buttonVariants({
                size: "lg",
                variant: "secondary",
              })}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Belanja Sekarang
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
