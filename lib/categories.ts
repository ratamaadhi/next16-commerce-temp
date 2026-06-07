import { strapiFetch } from "./strapi";

export interface CategoryData {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
    alternativeText?: string;
  };
  order?: string;
}

export interface CategoriesResponse {
  data: CategoryData[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
}

export async function getCategories() {
  return strapiFetch<CategoriesResponse>("/categories", {
    populate: ["image"],
    sort: ["order:asc", "name:asc"],
    pagination: { pageSize: 100 },
  });
}

export async function getCategoryBySlug(slug: string) {
  return strapiFetch<CategoriesResponse>("/categories", {
    filters: { slug: { $eq: slug } },
    populate: ["image"],
  });
}
