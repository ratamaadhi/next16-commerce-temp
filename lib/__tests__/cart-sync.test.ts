import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCart, createCart, updateCart, deleteCart, resolveCartItems } from "../cart-sync";

const { mockStrapiFetch, MockStrapiError, mockFetch } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
  mockFetch: vi.fn(),
  MockStrapiError: class extends Error {
    status: number;
    constructor(message: string, status: number, public details?: unknown) {
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

vi.stubGlobal("fetch", mockFetch);

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
      filters: { userDocumentId: { $eq: "user-xyz" } },
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

  it("posts a new cart via API proxy", async () => {
    const mockResponse = { data: { documentId: "new-cart", sessionId: "ses-1", items: [] } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await createCart({
      sessionId: "ses-1",
      items: [{ productId: 1, name: "Product", price: 100, quantity: 2, variantId: "v1" }],
    });
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          sessionId: "ses-1",
          items: [{ variantId: "v1", quantity: "2" }],
        },
      }),
    });
  });

  it("posts a cart with productId as fallback variantId for variantless products", async () => {
    const mockResponse = { data: { documentId: "new-cart", items: [] } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await createCart({
      items: [{ productId: 42, name: "Simple Product", price: 5000, quantity: 1 }],
    });
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          items: [{ variantId: "42", quantity: "1" }],
        },
      }),
    });
  });

  it("includes userDocumentId when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { documentId: "cart" } }),
    });
    await createCart({
      userDocumentId: "user-abc",
      items: [],
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         data: {
           userDocumentId: "user-abc",
           items: [],
         },
       }),
     });
   });

  it("throws when API proxy returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { error: { message: "Server error" } } }),
    });
    await expect(createCart({ items: [] })).rejects.toThrow("Server error");
  });
});

describe("updateCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts updated cart data via API proxy", async () => {
    const mockResponse = { data: { documentId: "cart-1", items: [] } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await updateCart("cart-1", {
      items: [{ productId: 1, name: "Test", price: 10, quantity: 3, variantId: "v1" }],
      sessionId: "ses-1",
    });
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("/api/cart/cart-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          sessionId: "ses-1",
          items: [{ variantId: "v1", quantity: "3" }],
        },
      }),
    });
  });

  it("includes userDocumentId when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });
    await updateCart("cart-doc", { userDocumentId: "user-1", items: [] });
    expect(mockFetch).toHaveBeenCalledWith("/api/cart/cart-doc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         data: {
           userDocumentId: "user-1",
           items: [],
         },
       }),
     });
   });

  it("throws when API proxy returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { error: { message: "Server error" } } }),
    });
    await expect(updateCart("doc-1", { items: [] })).rejects.toThrow("Server error");
  });
});

describe("deleteCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends delete request for cart documentId via API proxy", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => 1,
    });
    const result = await deleteCart("cart-to-delete");
    expect(result).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/cart/cart-to-delete", {
      method: "DELETE",
    });
  });

  it("throws when API proxy returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { error: { message: "Server error" } } }),
    });
    await expect(deleteCart("doc-1")).rejects.toThrow("Server error");
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

  it("resolves variantId to product details when variantId matches variant component ID", async () => {
    const strapiItems = [
      { quantity: "2", variantId: "5" },
    ];
    const productData = {
      data: [{
        id: 1,
        documentId: "prod-doc-1",
        name: "Test Product",
        price: 10000,
        images: [{ url: "/uploads/img.jpg" }],
        variants: [{ id: 5, name: "Red", price: 10000, sku: "SKU-1" }],
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
      variantId: "5",
      variantName: "Red",
    });
  });

  it("resolves dimensions from variant with fallback to product", async () => {
    const strapiItems = [
      { quantity: "1", variantId: "10" },
      { quantity: "2", variantId: "11" },
      { quantity: "1", variantId: "12" },
    ];
    const productData = {
      data: [
        {
          id: 1, documentId: "p1", name: "With Both", price: 100,
          dimensions: { length: 30, width: 20, height: 15, weight: 1500 },
          variants: [
            { id: 10, name: "Var A", price: 100, dimensions: { length: 25, width: 15, height: 10, weight: 800 } },
            { id: 11, name: "Var B", price: 100 },
          ],
        },
        {
          id: 2, documentId: "p2", name: "No Dims", price: 100,
          variants: [{ id: 12, name: "Var C", price: 100 }],
        },
      ],
      meta: {},
    };
    mockStrapiFetch.mockResolvedValueOnce(productData);

    const result = await resolveCartItems(strapiItems);
    expect(result).toHaveLength(3);

    expect(result[0].dimensions?.length).toBe(25);
    expect(result[0].dimensions?.weight).toBe(800);
    expect(result[0].weight).toBe(800);

    expect(result[1].dimensions?.length).toBe(30);
    expect(result[1].dimensions?.weight).toBe(1500);
    expect(result[1].weight).toBe(1500);

    expect(result[2].dimensions).toBeUndefined();
    expect(result[2].weight).toBe(500);
  });

  it("resolves variantId as product ID for variantless products", async () => {
    const strapiItems = [
      { quantity: "1", variantId: "42" },
    ];
    const productData = {
      data: [{
        id: 42,
        documentId: "prod-42",
        name: "Simple Product",
        price: 5000,
        images: [],
        variants: [],
      }],
      meta: {},
    };
    mockStrapiFetch.mockResolvedValueOnce(productData);

    const result = await resolveCartItems(strapiItems);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      productId: 42,
      name: "Simple Product",
      price: 5000,
      quantity: 1,
      variantId: "42",
    });
  });

  it("returns empty array when product not found for variantId", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const result = await resolveCartItems([{ quantity: "1", variantId: "999" }]);
    expect(result).toEqual([]);
  });

  it("returns empty array on API failure", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("API error"));
    const result = await resolveCartItems([{ quantity: "1", variantId: "5" }]);
    expect(result).toEqual([]);
  });
});
