import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  elektronik: "Elektronik",
  fashion: "Fashion",
  "makanan-minuman": "Makanan & Minuman",
  kesehatan: "Kesehatan",
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const name = CATEGORY_NAMES[slug];

  if (!name) notFound();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/categories"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Link>
        <h1 className="text-3xl font-bold">{name}</h1>
      </div>
      <p className="text-muted-foreground">Lihat produk di kategori {name}.</p>
    </main>
  );
}
