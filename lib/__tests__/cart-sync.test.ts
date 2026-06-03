import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCart, createCart, updateCart, deleteCart, resolveCartItems } from "../cart-sync";

const { mockStrapiFetch, MockStrapiError } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
  MockStrapiError: class extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "StrapiError";
      this.status = status;
    }
  },
}));

vi.mock("../strapi", () => ({
  strapiFetch: (...args: unknown[]) => mockStrapiFetch(...args),
  STRAPI_URL: "http://localhost:1337",
  StrapiError: MockStrapiError,
}));

describe("fetchCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when cart not found (404)", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new MockStrapiError("Not found", 404));
    const result = await fetchCart({ sessionId: "unknown-session" });
    expect(result).toBeNull();
  });

  it("returns first cart when found by sessionId", async () => {
    const mockCart = { documentId: "abc123", sessionId: "ses-1", items: [] };
    mockStrapiFetch.mockResolvedValueOnce({ data: [mockCart], meta: {} });
    const result = await fetchCart({ sessionId: "ses-1" });
    expect(result).toEqual(mockCart);
    expect(mockStrapiFetch.mock.calls[0][1]).toMatchObject({
      filters: { sessionId: { $eq: "ses-1" } },
      populate: "*",
    });
  });

  it("returns first cart when found by userDocumentId", async () => {
    const mockCart = { documentId: "cart456", items: [] };
    mockStrapiFetch.mockResolvedValueOnce({ data: [mockCart], meta: {} });
    const result = await fetchCart({ userDocumentId: "user-xyz" });
    expect(result).toEqual(mockCart);
    expect(mockStrapiFetch.mock.calls[0][1]).toMatchObject({
      filters: { users_permissions_user: { documentId: { $eq: "user-xyz" } } },
    });
  });

  it("returns null when data array is empty", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const result = await fetchCart({ sessionId: "ses" });
    expect(result).toBeNull();
  });

  it("passes auth token when provided", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchCart({ sessionId: "ses" }, "my-token");
    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/carts", expect.anything(), expect.anything(), "my-token"
    );
  });
});

describe("createCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts a new cart and returns the response", async () => {
    const mockResponse = { data: { documentId: "new-cart", sessionId: "ses-1", items: [] } };
    mockStrapiFetch.mockResolvedValueOnce(mockResponse);

    const result = await createCart({
      sessionId: "ses-1",
      items: [{ variantId: "variant-1", quantity: 2 }],
    });
    expect(result).toEqual(mockResponse);
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts", {}, {
      method: "POST",
      body: JSON.stringify({
        data: {
          sessionId: "ses-1",
          items: [{ variantId: "variant-1", quantity: "2" }],
        },
      }),
    }, undefined);
  });

  it("includes userDocumentId when provided", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: { documentId: "cart" } });
    await createCart({
      userDocumentId: "user-abc",
      items: [],
    });
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts", {}, {
      method: "POST",
      body: JSON.stringify({
        data: {
          users_permissions_user: "user-abc",
          items: [],
        },
      }),
    }, undefined);
  });

  it("throws when strapiFetch fails", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(createCart({ items: [] })).rejects.toThrow("Network error");
  });
});

describe("updateCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts updated cart data", async () => {
    const mockResponse = { data: { documentId: "cart-1", items: [] } };
    mockStrapiFetch.mockResolvedValueOnce(mockResponse);

    const result = await updateCart("cart-1", {
      items: [{ variantId: "v1", quantity: 3 }],
      sessionId: "ses-1",
    });
    expect(result).toEqual(mockResponse);
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts/cart-1", {}, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          sessionId: "ses-1",
          items: [{ variantId: "v1", quantity: "3" }],
        },
      }),
    }, undefined);
  });

  it("includes userDocumentId when provided", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: {} });
    await updateCart("cart-doc", { userDocumentId: "user-1", items: [] });
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts/cart-doc", {}, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          users_permissions_user: "user-1",
          items: [],
        },
      }),
    }, undefined);
  });

  it("throws when strapiFetch fails", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(updateCart("doc-1", { items: [] })).rejects.toThrow("Network error");
  });
});

describe("deleteCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends delete request for cart documentId", async () => {
    mockStrapiFetch.mockResolvedValueOnce(1);
    const result = await deleteCart("cart-to-delete");
    expect(result).toBe(1);
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts/cart-to-delete", {}, {
      method: "DELETE",
    }, undefined);
  });

  it("throws when strapiFetch fails", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(deleteCart("doc-1")).rejects.toThrow("Network error");
  });
});

describe("resolveCartItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for empty items", async () => {
    const result = await resolveCartItems([]);
    expect(result).toEqual([]);
  });

  it("resolves variantId to product details", async () => {
    const strapiItems = [
      { quantity: "2", variantId: "variant-doc-1" },
    ];
    const productData = {
      data: [{
        id: 1,
        documentId: "prod-doc-1",
        name: "Test Product",
        price: 10000,
        images: [{ url: "/uploads/img.jpg" }],
        variants: [{ id: "variant-doc-1", name: "Red", price: 10000, sku: "SKU-1" }],
      }],
      meta: {},
    };
    mockStrapiFetch.mockResolvedValueOnce(productData);

    const result = await resolveCartItems(strapiItems);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      productId: 1,
      name: "Test Product",
      price: 10000,
      quantity: 2,
      image: "/uploads/img.jpg",
      variantId: "variant-doc-1",
      variantName: "Red",
    });
  });

  it("returns empty array when product not found for variantId", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const result = await resolveCartItems([{ quantity: "1", variantId: "unknown" }]);
    expect(result).toEqual([]);
  });
});
