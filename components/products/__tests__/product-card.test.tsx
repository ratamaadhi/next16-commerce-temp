import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ProductCard } from "../product-card";
import type { ProductData } from "@/lib/products";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

vi.mock("@/hooks/use-wishlist", () => ({
  useWishlist: () => ({ data: [], isLoading: false }),
  useIsInWishlist: () => false,
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

afterEach(() => {
  cleanup();
});

const baseProduct: ProductData = {
  id: 1,
  documentId: "doc-1",
  name: "Test Product",
  slug: "test-product",
  price: 100000,
  images: [
    {
      id: 1,
      documentId: "img-1",
      url: "/uploads/test1.jpg",
      alternativeText: "Test image 1",
      width: 800,
      height: 1067,
    },
    {
      id: 2,
      documentId: "img-2",
      url: "/uploads/test2.jpg",
      alternativeText: "Test image 2",
      width: 800,
      height: 1067,
    },
  ],
};

describe("ProductCard", () => {
  it("renders product name and price", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Rp 100.000")).toBeInTheDocument();
  });

  it("shows discount badge and strikethrough price when on sale", () => {
    render(
      <ProductCard
        product={{
          ...baseProduct,
          compareAtPrice: 200000,
        }}
      />
    );
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(screen.getByText("Rp 200.000")).toBeInTheDocument();
  });

  it("shows featured badge for featured products", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, featured: true }}
      />
    );
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("shows condition badge when condition is set", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, condition: "like_new" }}
      />
    );
    expect(screen.getAllByText("Like New").length).toBeGreaterThan(0);
  });

  it("renders thumbnail strip when multiple images exist", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByLabelText("Pilih gambar 2 dari 2")).toBeInTheDocument();
  });

  it("does not render thumbnail strip for single-image products", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, images: [baseProduct.images![0]] }}
      />
    );
    expect(screen.queryByLabelText("Pilih gambar 2 dari 2")).not.toBeInTheDocument();
  });

  it("links to product detail page", () => {
    render(<ProductCard product={baseProduct} />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/products/test-product")).toBe(true);
  });

  it("shows quick-view button on desktop", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getAllByText("Quick View").length).toBeGreaterThan(0);
  });

  it("shows no-image fallback when images array is empty", () => {
    render(
      <ProductCard product={{ ...baseProduct, images: [] }} />
    );
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });
});
