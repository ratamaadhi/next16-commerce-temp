import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookiesGet })),
}));
vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => {
  cookiesGet.mockReset();
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

function bodyOf(call: unknown): Record<string, unknown> {
  const init = (call as [string, RequestInit])[1];
  return JSON.parse(init.body as string).data;
}

describe("POST /api/orders paymentMethod", () => {
  it("forwards manual_transfer when provided", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    // First fetch = order create; respond ok with an order.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ data: { orderNumber: "ORD-1" } }),
    });

    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productDocumentId: "p1" }],
        subtotal: 100000,
        totalAmount: 100000,
        paymentMethod: "manual_transfer",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).endsWith("/api/orders"),
    )!;
    expect(bodyOf(createCall).paymentMethod).toBe("manual_transfer");
  });

  it("defaults to gateway when omitted", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ data: { orderNumber: "ORD-1" } }),
    });

    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productDocumentId: "p1" }],
        subtotal: 100000,
        totalAmount: 100000,
      }),
    });
    await POST(req);

    const createCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).endsWith("/api/orders"),
    )!;
    expect(bodyOf(createCall).paymentMethod).toBe("gateway");
  });
});
