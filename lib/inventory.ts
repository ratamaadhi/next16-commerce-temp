import { strapiFetch } from "./strapi";

export async function checkInventory(
  productId: number,
  variantId?: string,
): Promise<{ available: number }> {
  try {
    const res = await strapiFetch<{
      data: Array<{
        id: number;
        inventory?: number;
        variants?: Array<{ id: number; inventory?: number }>;
      }>;
    }>("/products", {
      filters: { id: { $eq: productId } },
      populate: ["variants"],
    });

    const product = res.data?.[0];
    if (!product) return { available: 0 };

    if (variantId && product.variants?.length) {
      const variant = product.variants.find((v) => String(v.id) === variantId);
      return { available: variant?.inventory ?? 0 };
    }

    return { available: product.inventory ?? 0 };
  } catch {
    return { available: 0 };
  }
}
