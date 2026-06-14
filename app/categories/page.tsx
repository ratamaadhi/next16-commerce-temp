import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getCategories, type CategoryData } from "@/lib/categories";

export default async function CategoriesPage() {
  let categories: CategoryData[] = [];
  try {
    const response = await getCategories();
    categories = response.data;
  } catch {
    categories = [];
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-[family-name:var(--font-heading)]">Kategori</h1>
      {categories.length === 0 ? (
        <p className="text-muted-foreground">Belum ada kategori.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card key={cat.slug} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">{cat.name}</h2>
                {cat.description && <p className="text-muted-foreground mb-4">{cat.description}</p>}
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
      )}
    </main>
  );
}
