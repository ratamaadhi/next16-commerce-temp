import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, Heart, Star, Package } from "lucide-react";

const CATEGORIES = [
  { slug: "skincare", name: "Skincare", description: "Produk perawatan kulit preloved", icon: Sparkles },
  { slug: "makeup", name: "Makeup", description: "Kosmetik dan alat makeup", icon: Heart },
  { slug: "haircare", name: "Haircare", description: "Perawatan rambut dan styling", icon: Star },
  { slug: "fragrance", name: "Fragrance", description: "Parfum dan body mist", icon: Sparkles },
  { slug: "body-care", name: "Body Care", description: "Perawatan tubuh dan spa", icon: Heart },
  { slug: "beauty-tools", name: "Beauty Tools", description: "Alat kecantikan dan aksesoris", icon: Package },
];

export default function CategoriesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-[family-name:var(--font-playfair)]">Kategori</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <Card key={cat.slug} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <cat.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{cat.name}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{cat.description}</p>
              <Link
                href={`/products?category=${cat.slug}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Lihat Produk
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
