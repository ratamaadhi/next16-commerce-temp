import { getCategories, type CategoryData } from "@/lib/categories";
import { CategoriesView } from "@/components/categories/categories-view";

export const metadata = {
  title: "Kategori",
  description:
    "Jelajahi kategori koleksi preloved Cyra — fashion dan kecantikan terkurasi sesuai kebutuhan Anda.",
};

export default async function CategoriesPage() {
  let categories: CategoryData[] = [];
  try {
    const response = await getCategories();
    categories = response.data;
  } catch {
    categories = [];
  }

  return <CategoriesView categories={categories} />;
}
