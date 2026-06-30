export interface WishlistItem {
  id: number;
  documentId: string;
  product: {
    id: number;
    documentId: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images?: Array<{
      url: string;
      formats?: {
        small?: { url: string };
        medium?: { url: string };
        large?: { url: string };
      };
    }>;
    condition?: string;
    variants?: Array<{ id?: number; name: string; sku?: string; price: number; inventory?: number }>;
  };
  createdAt: string;
}
