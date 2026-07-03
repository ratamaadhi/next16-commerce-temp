import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookiesGet,
  })),
}));

vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";

beforeEach(() => {
  cookiesGet.mockReset();
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

describe("POST /api/vouchers/apply", () => {
  it("returns voucher discount for valid voucher", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: [
          {
            documentId: "voucher-1",
            code: "HEMAT10",
            discountType: "percentage",
            discountValue: 10,
            maxDiscountAmount: 30000,
            minPurchase: 100000,
            isActive: true,
            startDate: null,
            endDate: null,
          },
        ],
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({ code: "HEMAT10", subtotal: 200000 }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      valid: true,
      voucherDocumentId: "voucher-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      maxDiscountAmount: 30000,
      minPurchase: 100000,
      discountAmount: 20000,
    });
  });

  it("returns not found when voucher is missing", async () => {
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [] }),
    });

    const response = await POST(
      new Request("http://localhost/api/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({ code: "HILANG", subtotal: 200000 }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      valid: false,
      reason: "not_found",
      message: "Kode voucher tidak ditemukan",
    });
  });

  it("returns minimum purchase message when subtotal is too low", async () => {
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: [
          {
            documentId: "voucher-1",
            code: "MIN100K",
            discountType: "fixed",
            discountValue: 20000,
            maxDiscountAmount: null,
            minPurchase: 100000,
            isActive: true,
            startDate: null,
            endDate: null,
          },
        ],
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({ code: "MIN100K", subtotal: 50000 }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      valid: false,
      reason: "min_purchase",
      message: "Minimal belanja Rp100000 untuk memakai voucher ini",
    });
  });
});
