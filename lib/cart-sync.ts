import { strapiFetch, StrapiError } from "./strapi";
import type { components } from "@/types/strapi";
import type { CartItem } from "@/hooks/use-cart";

type CartResponse = components["schemas"]["CartResponse"];
type Cart = components["schemas"]["Cart"];
type CartListResponse = components["schemas"]["CartListResponse"];
type ProductCartItemComponent = components["schemas"]["ProductCartItemComponent"];

export interface FetchCartParams {
  sessionId?: string;
  userDocumentId?: string | number;
}

function mapItems(items: CartItem[]): Array<{ variantId: string; quantity: string }> {
  return items.map((item) => {
    const vid = item.variantId ? String(item.variantId) : String(item.productId);
    return { variantId: vid, quantity: String(item.quantity) };
  });
}

export async function fetchCart(params: FetchCartParams, token?: string): Promise<Cart | null> {
  const filters: Record<string, unknown> = {};
  if (params.sessionId) {
    filters["sessionId"] = { $eq: params.sessionId };
  }
  if (params.userDocumentId) {
    filters["userDocumentId"] = { $eq: params.userDocumentId };
  }
  try {
    const response = await strapiFetch<CartListResponse>(
      "/carts",
      { filters, populate: "*" },
      {},
      token,
    );
    return response.data?.[0] ?? null;
  } catch (error) {
    if (error instanceof StrapiError && error.status === 404) return null;
    throw error;
  }
}

export async function createCart(
  data: {
    sessionId?: string;
    userDocumentId?: string | number | null;
    items: CartItem[];
  },
): Promise<CartResponse> {
  const body: Record<string, unknown> = {};
  if (data.sessionId) body.sessionId = data.sessionId;
  if (data.userDocumentId !== undefined) body.userDocumentId = data.userDocumentId;
  body.items = mapItems(data.items);

  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new StrapiError(
      err?.error?.error?.message || `Cart API error: ${res.status}`,
      res.status,
      err,
    );
  }

  return res.json();
}

export async function updateCart(
  documentId: string,
  data: {
    sessionId?: string;
    userDocumentId?: string | number | null;
    items?: CartItem[];
  },
): Promise<CartResponse> {
  const body: Record<string, unknown> = {};
  if (data.sessionId) body.sessionId = data.sessionId;
  if (data.userDocumentId !== undefined) body.userDocumentId = data.userDocumentId;
  if (data.items) body.items = mapItems(data.items);

  const res = await fetch(`/api/cart/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new StrapiError(
      err?.error?.error?.message || `Cart API error: ${res.status}`,
      res.status,
      err,
    );
  }

  return res.json();
}

export async function deleteCart(documentId: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/cart/${documentId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new StrapiError(
      err?.error?.error?.message || `Cart API error: ${res.status}`,
      res.status,
      err,
    );
  }

  return res.json();
}

interface ResolvedProduct {
  id: number;
  documentId: string;
  name: string;
  sku?: string;
  price: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: number;
    name: string;
    price: number;
    sku?: string;
    inventory?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
    };
  }>;
}

export async function resolveCartItems(
  strapiItems: ProductCartItemComponent[],
): Promise<CartItem[]> {
  if (!strapiItems.length) return [];

  const ids = strapiItems.map((i) => i.variantId).filter(Boolean) as string[];
  if (!ids.length) return [];

  const variantFilters: Array<Record<string, unknown>> = [];
  const productIdFilters: Array<Record<string, unknown>> = [];

  for (const vid of ids) {
    variantFilters.push({ variants: { id: { $eq: vid } } });
    const numId = parseInt(vid, 10);
    if (!isNaN(numId)) {
      productIdFilters.push({ id: { $eq: numId } });
    }
  }

  interface ProductResponse {
    data: ResolvedProduct[];
    meta: Record<string, unknown>;
  }

  try {
    const response = await strapiFetch<ProductResponse>("/products", {
      filters: { $or: [...variantFilters, ...productIdFilters] },
      populate: ["images", "variants", "variants.dimensions", "dimensions"],
    });

    const products = response.data ?? [];

    return strapiItems
      .map((item) => {
        if (!item.variantId) return null;

        let product = products.find((p) =>
          p.variants?.some((v) => String(v.id) === item.variantId),
        );
        const variant = product?.variants?.find((v) => String(v.id) === item.variantId);

        if (!product) {
          const numId = parseInt(item.variantId, 10);
          if (!isNaN(numId)) {
            product = products.find((p) => p.id === numId);
          }
        }

        if (!product) return null;

        const variantDims = variant?.dimensions;
        const productDims = product.dimensions;
        const resolvedDims = variantDims ?? productDims;

        return {
          productId: product.id,
          productDocumentId: product.documentId,
          productSku: product.sku,
          name: product.name,
          price: variant?.price ?? product.price,
          quantity: parseInt(item.quantity ?? "1", 10),
          image: product.images?.[0]?.url,
          variantId: item.variantId,
          variantName: variant?.name,
          variantSku: variant?.sku,
          weight: resolvedDims?.weight ?? 500,
          dimensions: resolvedDims,
        } as CartItem;
      })
      .filter(Boolean) as CartItem[];
  } catch (error) {
    console.error("[cart-sync] resolveCartItems failed:", error);
    return [];
  }
}
