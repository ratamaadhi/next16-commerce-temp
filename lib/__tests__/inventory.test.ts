import { describe, it, expect, vi, beforeEach } from "vitest";
import { decrementInventory } from "../inventory";

const mockStrapiFetch = vi.hoisted(() => vi.fn());

vi.mock("../strapi", () => ({
  strapiFetch: mockStrapiFetch,
  StrapiError: class StrapiError extends Error {
    constructor(
      message: string,
      public status: number,
      public details?: unknown,
    ) {
      super(message);
      this.name = "StrapiError";
    }
  },
}));

describe("decrementInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrements simple product inventory", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({ data: { inventory: "10" } })
      .mockResolvedValueOnce({ data: { inventory: "8" } });

    await decrementInventory(
      [{ productDocumentId: "doc123", quantity: 2 }],
      "token",
    );

    expect(mockStrapiFetch).toHaveBeenCalledTimes(2);
    const putCall = mockStrapiFetch.mock.calls[1];
    expect(putCall[0]).toBe("/products/doc123");
    expect(putCall[2].method).toBe("PUT");
    expect(JSON.parse(putCall[2].body).data.inventory).toBe("8");
  });

  it("decrements variant inventory", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({
        data: {
          documentId: "doc123",
          variants: [
            { id: 1, sku: "VAR-RED", inventory: "10" },
            { id: 2, sku: "VAR-BLUE", inventory: "5" },
          ],
        },
      })
      .mockResolvedValueOnce({ data: {} });

    await decrementInventory(
      [{ productDocumentId: "doc123", variantSku: "VAR-RED", quantity: 3 }],
      "token",
    );

    const putCall = mockStrapiFetch.mock.calls[1];
    const body = JSON.parse(putCall[2].body);
    expect(body.data.variants[0].inventory).toBe("7");
    expect(body.data.variants[1].inventory).toBe("5");
  });

  it("does not go below zero", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({ data: { inventory: "2" } })
      .mockResolvedValueOnce({ data: { inventory: "0" } });

    await decrementInventory(
      [{ productDocumentId: "doc123", quantity: 5 }],
      "token",
    );

    const putCall = mockStrapiFetch.mock.calls[1];
    const body = JSON.parse(putCall[2].body);
    expect(body.data.inventory).toBe("0");
  });

  it("handles multiple items", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({ data: { inventory: "10" } })
      .mockResolvedValueOnce({ data: { inventory: "7" } })
      .mockResolvedValueOnce({ data: { inventory: "20" } })
      .mockResolvedValueOnce({ data: { inventory: "18" } });

    await decrementInventory(
      [
        { productDocumentId: "doc1", quantity: 3 },
        { productDocumentId: "doc2", quantity: 2 },
      ],
      "token",
    );

    expect(mockStrapiFetch).toHaveBeenCalledTimes(4);

    const put1 = JSON.parse(mockStrapiFetch.mock.calls[1][2].body);
    expect(put1.data.inventory).toBe("7");

    const put2 = JSON.parse(mockStrapiFetch.mock.calls[3][2].body);
    expect(put2.data.inventory).toBe("18");
  });

  it("continues on error for one item", async () => {
    mockStrapiFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ data: { inventory: "10" } })
      .mockResolvedValueOnce({ data: { inventory: "8" } });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await decrementInventory(
      [
        { productDocumentId: "doc1", quantity: 2 },
        { productDocumentId: "doc2", quantity: 2 },
      ],
      "token",
    );

    expect(mockStrapiFetch).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
