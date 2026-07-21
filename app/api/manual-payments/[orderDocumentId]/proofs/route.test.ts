import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookiesGet })),
}));
vi.stubGlobal("fetch", fetchMock);

vi.hoisted(() => {
  process.env.STRAPI_URL = "https://strapi.example.com";
});

import { POST } from "./route";

beforeEach(() => {
  cookiesGet.mockReset();
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

function makeReq(hasImage: boolean, hasSender = true) {
  const form = new FormData();
  if (hasImage) {
    form.append("files", new File(["x"], "proof.png", { type: "image/png" }));
  }
  if (hasSender) {
    form.append("senderName", "Cyra");
  }
  return { formData: async () => form } as unknown as Request;
}

const ctx = { params: Promise.resolve({ orderDocumentId: "doc-1" }) };

describe("POST /api/manual-payments/:id/proofs", () => {
  it("401 when no token", async () => {
    cookiesGet.mockReturnValue(undefined);
    const res = await POST(makeReq(true), ctx);
    expect(res.status).toBe(401);
  });

  it("400 when no image field", async () => {
    cookiesGet.mockReturnValue({ value: "t" });
    const res = await POST(makeReq(false), ctx);
    expect(res.status).toBe(400);
  });

  it("400 when senderName missing", async () => {
    cookiesGet.mockReturnValue({ value: "t" });
    const res = await POST(makeReq(true, false), ctx);
    expect(res.status).toBe(400);
  });

  it("forwards to Strapi and returns its payload", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { status: "under_review" } }), {
        status: 200,
      }),
    );

    const res = await POST(makeReq(true), ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { status: "under_review" } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://strapi.example.com/api/manual-payments/doc-1/proofs");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer token-123");
    // must NOT set Content-Type manually (boundary is auto-generated)
    expect(init.headers["Content-Type"]).toBeUndefined();
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    // files must be a File (not string)
    const files = body.get("files");
    expect(files).toBeInstanceOf(File);
    // data must contain senderName JSON
    const data = JSON.parse(body.get("data") as string);
    expect(data.senderName).toBe("Cyra");
    expect(data.proofStatus).toBe("pending");
  });

  it("passes through Strapi error status and message", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Order is no longer active" } }), {
        status: 400,
      }),
    );

    const res = await POST(makeReq(true), ctx);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: { message: "Order is no longer active" },
    });
  });
});
