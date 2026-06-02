import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const CATEGORIES = [
  { slug: "elektronik", name: "Elektronik", description: "Produk elektronik terbaru" },
  { slug: "fashion", name: "Fashion", description: "Pakaian dan aksesoris" },
  { slug: "makanan-minuman", name: "Makanan & Minuman", description: "Produk makanan dan minuman" },
  { slug: "kesehatan", name: "Kesehatan", description: "Produk kesehatan dan kecantikan" },
];

export default function CategoriesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Kategori</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <Card key={cat.slug} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">{cat.name}</h2>
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
