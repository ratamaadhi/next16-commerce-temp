import { strapiFetch } from "./strapi";

export interface StrapiImage {
  id?: number;
  documentId?: string;
  name?: string;
  alternativeText?: string;
  url: string;
  width?: number;
  height?: number;
}

export interface ProductData {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  shortDescription?: string;
  description?: string;
  inventory?: number;
  sku?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  images?: StrapiImage[];
  featured?: boolean;
  condition?: "like_new" | "gently_used" | "well_loved";
  categories?: ProductData[];
  variants?: Array<{ id?: number; name: string; sku?: string; price: number; inventory?: number }>;
  specifications?: Array<{ label: string; value: string }>;
  reviews?: Array<{ id: number; rating: number; title: string; comment: string; verified: boolean; createdAt: string; user?: { username: string } }>;
  publishedAt?: string;
  createdAt?: string;
}

export interface ProductsResponse {
  data: ProductData[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
}

const SORT_MAP: Record<string, string[]> = {
  terbaru: ["createdAt:desc"],
  termurah: ["price:asc"],
  termahal: ["price:desc"],
  "nama-az": ["name:asc"],
  "nama-za": ["name:desc"],
};

export async function getProducts(page = 1, pageSize = 12, categorySlug?: string, sort?: string, search?: string) {
  const filters: Record<string, unknown> = {
    publishedAt: { $notNull: true },
  };

  if (categorySlug) {
    filters["categories"] = { slug: { $eq: categorySlug } };
  }

  if (search) {
    filters["name"] = { $containsi: search };
  }

  return strapiFetch<ProductsResponse>("/products", {
    populate: ["images", "categories", "variants"],
    filters,
    sort: SORT_MAP[sort ?? "terbaru"],
    pagination: { page, pageSize },
  });
}

export async function getProductBySlug(slug: string) {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { slug: { $eq: slug } },
    populate: ["images", "categories", "variants", "specifications", "reviews.user"],
  });
}

export async function getFeaturedProducts() {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { featured: { $eq: true }, publishedAt: { $notNull: true } },
    populate: ["images", "categories"],
    pagination: { pageSize: 8 },
    sort: ["createdAt:desc"],
  });
}
