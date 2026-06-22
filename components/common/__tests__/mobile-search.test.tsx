import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { MobileSearch } from "../mobile-search";

describe("MobileSearch", () => {
  beforeEach(() => {
    mockPush.mockClear();
    cleanup();
  });

  it("renders a search icon button when collapsed", () => {
    render(<MobileSearch />);
    expect(screen.getByRole("button", { name: /cari produk/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/cari produk/i)).not.toBeInTheDocument();
  });

  it("expands to show search input when icon is clicked", () => {
    render(<MobileSearch />);
    fireEvent.click(screen.getByRole("button", { name: /cari produk/i }));
    expect(screen.getByPlaceholderText(/cari produk/i)).toBeInTheDocument();
  });

  it("auto-focuses the input when expanded", () => {
    render(<MobileSearch />);
    fireEvent.click(screen.getByRole("button", { name: /cari produk/i }));
    expect(screen.getByPlaceholderText(/cari produk/i)).toHaveFocus();
  });

  it("collapses back to icon when close button is clicked", () => {
    render(<MobileSearch />);
    fireEvent.click(screen.getByRole("button", { name: /cari produk/i }));
    fireEvent.click(screen.getByRole("button", { name: /tutup pencarian/i }));
    expect(screen.queryByPlaceholderText(/cari produk/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cari produk/i })).toBeInTheDocument();
  });

  it("collapses after a successful search submit", () => {
    render(<MobileSearch />);
    fireEvent.click(screen.getByRole("button", { name: /cari produk/i }));
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.change(input, { target: { value: "baju" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).toHaveBeenCalledWith("/products?search=baju");
    expect(screen.queryByPlaceholderText(/cari produk/i)).not.toBeInTheDocument();
  });

  it("does not navigate or collapse on empty submit", () => {
    render(<MobileSearch />);
    fireEvent.click(screen.getByRole("button", { name: /cari produk/i }));
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/cari produk/i)).toBeInTheDocument();
  });

  it("collapses when Escape is pressed in the input", () => {
    render(<MobileSearch />);
    fireEvent.click(screen.getByRole("button", { name: /cari produk/i }));
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByPlaceholderText(/cari produk/i)).not.toBeInTheDocument();
  });
});
