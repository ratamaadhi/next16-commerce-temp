import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCartSync } from "../use-cart-sync";
import { useCartStore } from "../use-cart";

vi.mock("../use-cart", async () => {
  const actual = await vi.importActual("../use-cart");
  return { ...actual };
});

vi.mock("@/lib/cart-session", () => ({
  getOrCreateSessionId: vi.fn(),
}));

vi.mock("@/lib/cart-sync", () => ({
  fetchCart: vi.fn(),
  createCart: vi.fn(),
  updateCart: vi.fn(),
  deleteCart: vi.fn(),
  resolveCartItems: vi.fn(),
}));

const mockGetOrCreateSessionId = vi.fn();
const mockFetchCart = vi.fn();
const mockCreateCart = vi.fn();
const mockUpdateCart = vi.fn();
const mockDeleteCart = vi.fn();
const mockResolveCartItems = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mockGetOrCreateSessionId).mockReturnValue("test-session-id");

  useCartStore.setState({
    items: [],
    sessionId: null,
    cartDocumentId: null,
  });
});

async function setupCartSync(userDocumentId?: string | null) {
  const mod = await import("@/lib/cart-session");
  const sync = await import("@/lib/cart-sync");
  vi.mocked(mod.getOrCreateSessionId).mockImplementation(mockGetOrCreateSessionId);
  vi.mocked(sync.fetchCart).mockImplementation(mockFetchCart);
  vi.mocked(sync.createCart).mockImplementation(mockCreateCart);
  vi.mocked(sync.updateCart).mockImplementation(mockUpdateCart);
  vi.mocked(sync.deleteCart).mockImplementation(mockDeleteCart);
  vi.mocked(sync.resolveCartItems).mockImplementation(mockResolveCartItems);

  return renderHook(() => useCartSync(userDocumentId));
}

describe("useCartSync — initialization", () => {
  it("sets sessionId from cookie on mount", async () => {
    await act(async () => {
      await setupCartSync();
    });
    expect(useCartStore.getState().sessionId).toBe("test-session-id");
  });

  it("hydrates from Strapi when cart exists for sessionId", async () => {
    const serverCart = {
      documentId: "server-cart-doc",
      sessionId: "test-session-id",
      items: [{ quantity: "2", variantId: "variant-1" }],
    };
    const resolvedItems = [
      { productId: 1, name: "Test", price: 100, quantity: 2, variantId: "variant-1" },
    ];

    mockFetchCart.mockResolvedValueOnce(serverCart);
    mockResolveCartItems.mockResolvedValueOnce(resolvedItems);

    await act(async () => {
      await setupCartSync();
    });

    await waitFor(() => {
      expect(useCartStore.getState().cartDocumentId).toBe("server-cart-doc");
      expect(useCartStore.getState().items).toEqual(resolvedItems);
    });
  });

  it("sets empty state when no cart found in Strapi", async () => {
    mockFetchCart.mockResolvedValueOnce(null);

    await act(async () => {
      await setupCartSync();
    });

    await waitFor(() => {
      expect(useCartStore.getState().cartDocumentId).toBeNull();
    });
  });
});
