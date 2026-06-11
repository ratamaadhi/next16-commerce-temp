import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
import { AddToCartButton } from "../add-to-cart-button";

describe("AddToCartButton — disabled text", () => {
  it('shows "Tambah ke Keranjang" when not disabled', () => {
    render(
      <AddToCartButton
        productId={1}
        productDocumentId="doc-1"
        productName="Test Product"
        price={100}
      />,
    );
    expect(screen.getByText("Tambah ke Keranjang")).toBeInTheDocument();
  });

  it('shows "Stok Habis" when disabled and not needsVariant', () => {
    render(
      <AddToCartButton
        productId={1}
        productDocumentId="doc-1"
        productName="Test Product"
        price={100}
        disabled
      />,
    );
    expect(screen.getByText("Stok Habis")).toBeInTheDocument();
  });

  it('shows "Pilih Variant" when disabled and needsVariant is true', () => {
    render(
      <AddToCartButton
        productId={1}
        productDocumentId="doc-1"
        productName="Test Product"
        price={100}
        disabled
        needsVariant
      />,
    );
    expect(screen.getByText("Pilih Variant")).toBeInTheDocument();
  });
});
