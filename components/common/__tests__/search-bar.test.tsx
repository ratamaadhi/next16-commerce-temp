import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { SearchBar } from "../search-bar";

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockClear();
    cleanup();
  });

  it("calls onClose after a successful submit", () => {
    const onClose = vi.fn();
    render(<SearchBar onClose={onClose} />);
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.change(input, { target: { value: "tas" } });
    fireEvent.submit(input.closest("form")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose on empty submit", () => {
    const onClose = vi.fn();
    render(<SearchBar onClose={onClose} />);
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.submit(input.closest("form")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<SearchBar onClose={onClose} />);
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not error when onClose is not provided", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/cari produk/i);
    fireEvent.keyDown(input, { key: "Escape" });
    // no throw
  });
});
