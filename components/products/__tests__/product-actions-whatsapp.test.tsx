// components/products/__tests__/product-actions-whatsapp.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ProductActions } from "../product-actions";

// Mock useStoreSettings
vi.mock("@/hooks/use-store-settings", () => ({
  useStoreSettings: vi.fn(),
}));

// Mock AddToCartButton (avoids Zustand/QueryClient deps in test)
vi.mock("@/components/cart/add-to-cart-button", () => ({
  AddToCartButton: () => null,
}));

// Mock VariantSelector
vi.mock("../variant-selector", () => ({
  VariantSelector: () => null,
}));

// Mock formatPrice
vi.mock("@/lib/strapi", () => ({
  formatPrice: (p: number) => `Rp${p}`,
}));

import { useStoreSettings } from "@/hooks/use-store-settings";

const baseProduct = {
  id: 1,
  documentId: "abc",
  name: "Produk Test",
  price: 100000,
  shortDescription: null,
  compareAtPrice: null,
  images: [],
  variants: [],
  inventory: 10,
  dimensions: null,
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ProductActions — WhatsApp button", () => {
  it("renders WhatsApp link when whatsappNumber is set", () => {
    vi.mocked(useStoreSettings).mockReturnValue({ whatsappNumber: "628123456789" });
    render(<ProductActions product={baseProduct as any} variants={[]} />);
    const link = screen.getByRole("link", { name: /tanyakan produk/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toContain("wa.me/628123456789");
    expect(link.getAttribute("href")).toContain("Produk%20Test");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("hides WhatsApp link when whatsappNumber is null", () => {
    vi.mocked(useStoreSettings).mockReturnValue({ whatsappNumber: null });
    render(<ProductActions product={baseProduct as any} variants={[]} />);
    expect(screen.queryByRole("link", { name: /tanyakan produk/i })).toBeNull();
  });

  it("hides WhatsApp link when whatsappNumber is empty string", () => {
    vi.mocked(useStoreSettings).mockReturnValue({ whatsappNumber: "" });
    render(<ProductActions product={baseProduct as any} variants={[]} />);
    expect(screen.queryByRole("link", { name: /tanyakan produk/i })).toBeNull();
  });
});
