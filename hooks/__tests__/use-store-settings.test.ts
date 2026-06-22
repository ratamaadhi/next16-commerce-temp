import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useStoreSettings } from "../use-store-settings";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const QueryProvider = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  QueryProvider.displayName = "QueryProvider";
  return QueryProvider;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useStoreSettings", () => {
  it("returns whatsappNumber from API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { whatsappNumber: "628123456789" } }), {
        status: 200,
      })
    );
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.whatsappNumber).toBe("628123456789"));
  });

  it("returns null when API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.whatsappNumber).toBeNull());
  });

  it("returns null when whatsappNumber missing from response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: {} }), { status: 200 })
    );
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.whatsappNumber).toBeNull());
  });
});
