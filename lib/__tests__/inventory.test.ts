import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkInventory } from "../inventory";

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
  StrapiError: MockStrapiError,
}));

describe("checkInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns inventory for product without variants", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: [{ id: 1, documentId: "p1", name: "Test", inventory: 10 }],
      meta: {},
    });
    const result = await checkInventory(1);
    expect(result.available).toBe(10);
  });

  it("returns inventory for specific variant", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: [{
        id: 1, documentId: "p1", name: "Test",
        variants: [{ id: 5, name: "Red", inventory: 3 }],
      }],
      meta: {},
    });
    const result = await checkInventory(1, "5");
    expect(result.available).toBe(3);
  });

  it("returns 0 when product not found", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const result = await checkInventory(999);
    expect(result.available).toBe(0);
  });

  it("returns 0 when variant not found", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: [{
        id: 1, documentId: "p1", name: "Test",
        variants: [{ id: 5, name: "Red", inventory: 3 }],
      }],
      meta: {},
    });
    const result = await checkInventory(1, "999");
    expect(result.available).toBe(0);
  });

  it("returns 0 on API failure", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await checkInventory(1);
    expect(result.available).toBe(0);
  });
});
