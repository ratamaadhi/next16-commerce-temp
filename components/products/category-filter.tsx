"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  currentSlug?: string;
  categories: { slug: string; name: string }[];
}

export function CategoryFilter({ currentSlug, categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilter = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!currentSlug ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilter(undefined)}
      >
        Semua
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.slug}
          variant={currentSlug === cat.slug ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter(cat.slug)}
          className="capitalize"
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
