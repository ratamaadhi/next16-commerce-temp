import { strapiFetch } from "./strapi";
import { StrapiError } from "./strapi";
import type { components } from "@/types/strapi";
import type { CartItem } from "@/hooks/use-cart";

type CartResponse = components["schemas"]["CartResponse"];
type Cart = components["schemas"]["Cart"];
type CartListResponse = components["schemas"]["CartListResponse"];
type ProductCartItemComponent = components["schemas"]["ProductCartItemComponent"];

export interface FetchCartParams {
  sessionId?: string;
  userDocumentId?: string;
}

function mapItems(items: CartItem[]): Array<{ variantId: string; quantity: string }> {
  return items.map((item) => ({
    variantId: item.variantId ?? "default",
    quantity: String(item.quantity),
  }));
}

export async function fetchCart(
  params: FetchCartParams,
  token?: string,
): Promise<Cart | null> {
  const filters: Record<string, unknown> = {};
  if (params.sessionId) {
    filters["sessionId"] = { $eq: params.sessionId };
  }
  if (params.userDocumentId) {
    filters["users_permissions_user"] = { documentId: { $eq: params.userDocumentId } };
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
    userDocumentId?: string;
    items: CartItem[];
  },
  token?: string,
): Promise<CartResponse> {
  const body: Record<string, unknown> = {};
  if (data.sessionId) body.sessionId = data.sessionId;
  if (data.userDocumentId) body.users_permissions_user = data.userDocumentId;
  body.items = mapItems(data.items);

  return strapiFetch<CartResponse>("/carts", {}, {
    method: "POST",
    body: JSON.stringify({ data: body }),
  }, token);
}

export async function updateCart(
  documentId: string,
  data: {
    sessionId?: string;
    userDocumentId?: string;
    items?: CartItem[];
  },
  token?: string,
): Promise<CartResponse> {
  const body: Record<string, unknown> = {};
  if (data.sessionId) body.sessionId = data.sessionId;
  if (data.userDocumentId) body.users_permissions_user = data.userDocumentId;
  if (data.items) body.items = mapItems(data.items);

  return strapiFetch<CartResponse>(`/carts/${documentId}`, {}, {
    method: "PUT",
    body: JSON.stringify({ data: body }),
  }, token);
}

export async function deleteCart(
  documentId: string,
  token?: string,
): Promise<number> {
  return strapiFetch<number>(`/carts/${documentId}`, {}, {
    method: "DELETE",
  }, token);
}

interface ResolvedProduct {
  id: number;
  documentId: string;
  name: string;
  price: number;
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: number;
    name: string;
    price: number;
    sku?: string;
    inventory?: number;
  }>;
}

export async function resolveCartItems(
  strapiItems: ProductCartItemComponent[],
): Promise<CartItem[]> {
  if (!strapiItems.length) return [];

  const variantIds = strapiItems.map((i) => i.variantId).filter(Boolean) as string[];
  if (!variantIds.length) return [];

  const filters: Record<string, unknown> = {};
  variantIds.forEach((vid) => {
    filters[`$or`] = filters[`$or`] || [];
    (filters[`$or`] as Array<Record<string, unknown>>).push({
      variants: { id: { $eq: vid } },
    });
  });

  interface ProductResponse {
    data: ResolvedProduct[];
    meta: Record<string, unknown>;
  }

  try {
    const response = await strapiFetch<ProductResponse>("/products", {
      filters: filters["$or"] ? { $or: filters["$or"] } : undefined,
      populate: ["images", "variants"],
    });

    const products = response.data ?? [];

    return strapiItems
      .map((item) => {
        const product = products.find((p) =>
          p.variants?.some((v) => String(v.id) === item.variantId),
        );
        if (!product) return null;

        const variant = product.variants?.find(
          (v) => String(v.id) === item.variantId,
        );

        return {
          productId: product.id,
          name: product.name,
          price: variant?.price ?? product.price,
          quantity: parseInt(item.quantity ?? "1", 10),
          image: product.images?.[0]?.url,
          variantId: item.variantId,
          variantName: variant?.name,
        } as CartItem;
      })
      .filter(Boolean) as CartItem[];
  } catch (error) {
    console.error("[cart-sync] resolveCartItems failed:", error);
    return [];
  }
}
