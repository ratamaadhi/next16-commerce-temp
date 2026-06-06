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
  weight?: number;
  images?: StrapiImage[];
  featured?: boolean;
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

export async function getProducts(page = 1, pageSize = 12, categorySlug?: string) {
  const filters: Record<string, unknown> = {
    publishedAt: { $notNull: true },
  };

  if (categorySlug) {
    filters["categories"] = { slug: { $eq: categorySlug } };
  }

  return strapiFetch<ProductsResponse>("/products", {
    populate: ["images", "categories", "variants"],
    filters,
    sort: ["createdAt:desc"],
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
