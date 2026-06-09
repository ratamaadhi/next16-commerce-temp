import { strapiFetch } from "./strapi";

interface OrderItem {
  productDocumentId: string;
  variantSku?: string;
  quantity: number;
}

export async function decrementInventory(
  items: OrderItem[],
  token: string,
): Promise<void> {
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (item.variantSku) {
        await decrementVariantInventory(
          item.productDocumentId,
          item.variantSku,
          item.quantity,
          token,
        );
      } else {
        await decrementSimpleProductInventory(
          item.productDocumentId,
          item.quantity,
          token,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Product ${item.productDocumentId}: ${msg}`);
    }
  }

  if (errors.length > 0) {
    console.error("[inventory] Decrement errors:", errors);
  }
}

async function decrementSimpleProductInventory(
  documentId: string,
  quantity: number,
  token: string,
): Promise<void> {
  const response = await strapiFetch<{ data: { inventory?: string } }>(
    `/products/${documentId}`,
  );

  const currentInventory = parseInt(response.data.inventory ?? "0", 10);
  const newInventory = Math.max(0, currentInventory - quantity);

  await strapiFetch(
    `/products/${documentId}`,
    {},
    {
      method: "PUT",
      body: JSON.stringify({ data: { inventory: String(newInventory) } }),
    },
    token,
  );
}

interface VariantItem {
  id: number;
  sku?: string;
  inventory?: string;
}

interface ProductWithVariants {
  documentId: string;
  inventory?: string;
  variants?: VariantItem[];
}

async function decrementVariantInventory(
  productDocumentId: string,
  variantSku: string,
  quantity: number,
  token: string,
): Promise<void> {
  const response = await strapiFetch<{ data: ProductWithVariants }>(
    `/products/${productDocumentId}`,
    { populate: ["variants"] },
  );

  const product = response.data;
  if (!product.variants) {
    throw new Error("Product has no variants");
  }

  const variantIndex = product.variants.findIndex(
    (v) => v.sku === variantSku,
  );
  if (variantIndex === -1) {
    throw new Error(`Variant with SKU ${variantSku} not found`);
  }

  const updatedVariants = product.variants.map((v, i) => {
    if (i !== variantIndex) return v;
    const currentInv = parseInt(v.inventory ?? "0", 10);
    return { ...v, inventory: String(Math.max(0, currentInv - quantity)) };
  });

  await strapiFetch(
    `/products/${productDocumentId}`,
    {},
    {
      method: "PUT",
      body: JSON.stringify({ data: { variants: updatedVariants } }),
    },
    token,
  );
}
