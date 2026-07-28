import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { GET } from "./route";

beforeEach(() => {
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

describe("GET /api/store-setting/payment-methods", () => {
  it("passes through the Strapi payment methods payload", async () => {
    const payload = {
      data: {
        gateway: true,
        manualTransfer: true,
        bankAccounts: [
          {
            bankName: "BCA",
            accountNumber: "1234567890",
            accountHolder: "Toko Jaya",
            instructions: null,
          },
        ],
      },
    };
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://strapi.example.com/api/store-setting/payment-methods",
      { cache: "no-store" },
    );
  });

  it("returns disabled defaults when Strapi errors", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { gateway: false, manualTransfer: false, bankAccounts: [] },
    });
  });
});
