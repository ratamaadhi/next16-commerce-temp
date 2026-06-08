import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrders, getOrderByNumber, createOrder } from "../orders";

const { mockStrapiFetch, MockStrapiError } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
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

const mockOrder = {
  id: 1,
  documentId: "ord-doc-1",
  orderNumber: "ORD-1712345678-ABC123",
  orderStatus: "pending",
  paymentStatus: "pending",
  subtotal: 500000,
  tax: 55000,
  shippingCost: 15000,
  discount: 0,
  totalAmount: 570000,
  currency: "IDR",
  createdAt: "2025-01-01T00:00:00.000Z",
  items: [
    {
      productName: "Test Product",
      quantity: "2",
      unitPrice: 250000,
      totalPrice: 500000,
    },
  ],
  shippingAddress: {
    firstName: "John",
    lastName: "Doe",
    phone: "08123456789",
    addressLine1: "Jl. Test No. 1",
    city: "Jakarta",
    state: "DKI Jakarta",
    postalCode: "12345",
    country: "Indonesia",
  },
};

const mockToken = "valid-jwt-token";

describe("getOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of orders on success", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [mockOrder], meta: { pagination: { page: 1, pageSize: 50, pageCount: 1, total: 1 } } });

    const result = await getOrders(mockToken);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].orderNumber).toBe("ORD-1712345678-ABC123");
    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/orders",
      { populate: "*", sort: ["createdAt:desc"], pagination: { pageSize: 50 } },
      {},
      mockToken,
    );
  });

  it("returns empty list when user has no orders", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: { pagination: { page: 1, pageSize: 50, pageCount: 0, total: 0 } } });

    const result = await getOrders(mockToken);

    expect(result.data).toEqual([]);
  });

  it("throws StrapiError when token is invalid", async () => {
    mockStrapiFetch.mockRejectedValue(new MockStrapiError("Unauthorized", 401));

    await expect(getOrders("invalid-token")).rejects.toThrow(MockStrapiError);
  });

  it("throws on network error", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(getOrders(mockToken)).rejects.toThrow("Network error");
  });
});

describe("getOrderByNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns order when found by orderNumber", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [mockOrder], meta: {} });

    const result = await getOrderByNumber("ORD-1712345678-ABC123", mockToken);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].orderNumber).toBe("ORD-1712345678-ABC123");
    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/orders",
      { filters: { orderNumber: { $eq: "ORD-1712345678-ABC123" } }, populate: "*" },
      {},
      mockToken,
    );
  });

  it("returns empty data when order not found", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });

    const result = await getOrderByNumber("ORD-NONEXISTENT", mockToken);

    expect(result.data).toEqual([]);
  });

  it("throws StrapiError when token is invalid", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new MockStrapiError("Unauthorized", 401));

    await expect(getOrderByNumber("ORD-1", "bad-token")).rejects.toThrow(MockStrapiError);
  });

  it("throws on network error", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("Connection refused"));

    await expect(getOrderByNumber("ORD-1", mockToken)).rejects.toThrow("Connection refused");
  });
});

describe("createOrder", () => {
  const orderData = {
    orderNumber: "ORD-1712345678-NEW123",
    orderStatus: "pending" as const,
    paymentStatus: "pending" as const,
    subtotal: 250000,
    tax: 27500,
    shippingCost: 10000,
    discount: 0,
    totalAmount: 287500,
    currency: "IDR",
    items: [{ productName: "New Product", quantity: "1", unitPrice: 250000, totalPrice: 250000 }],
    shippingAddress: { firstName: "Jane", lastName: "Doe", phone: "08123456789", addressLine1: "Jl. Baru No. 1", city: "Bandung", state: "Jawa Barat", postalCode: "40123", country: "Indonesia" },
    billingAddress: { firstName: "Jane", lastName: "Doe", phone: "08123456789", addressLine1: "Jl. Baru No. 1", city: "Bandung", state: "Jawa Barat", postalCode: "40123", country: "Indonesia" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an order successfully", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: { ...mockOrder, orderNumber: "ORD-1712345678-NEW123" }, meta: {} });

    const result = await createOrder(orderData, mockToken);

    expect(result.data.orderNumber).toBe("ORD-1712345678-NEW123");
    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/orders",
      {},
      { method: "POST", body: JSON.stringify(orderData) },
      mockToken,
    );
  });

  it("throws StrapiError on validation error", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new MockStrapiError("Validation error", 400, { error: { details: { errors: [{ path: ["orderNumber"], message: "orderNumber is required" }] } } }));

    await expect(createOrder({} as typeof orderData, mockToken)).rejects.toThrow(MockStrapiError);
  });

  it("throws StrapiError when token is invalid", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new MockStrapiError("Forbidden", 403));

    await expect(createOrder(orderData, "bad-token")).rejects.toThrow(MockStrapiError);
  });
});
