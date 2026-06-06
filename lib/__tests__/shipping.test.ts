import { describe, it, expect } from "vitest";
import { getDimensionsByWeight, getItemDimensions, getCartDimensions } from "../shipping";
import type { CartItem } from "@/hooks/use-cart";

describe("getDimensionsByWeight", () => {
  it("returns small box for <= 1kg", () => {
    expect(getDimensionsByWeight(500)).toEqual({ length: 20, width: 15, height: 10 });
    expect(getDimensionsByWeight(1000)).toEqual({ length: 20, width: 15, height: 10 });
  });

  it("returns medium box for <= 2kg", () => {
    expect(getDimensionsByWeight(1500)).toEqual({ length: 27, width: 13, height: 7 });
    expect(getDimensionsByWeight(2000)).toEqual({ length: 27, width: 13, height: 7 });
  });

  it("returns large box for <= 5kg", () => {
    expect(getDimensionsByWeight(3500)).toEqual({ length: 30, width: 20, height: 15 });
  });

  it("returns xl box for > 5kg", () => {
    expect(getDimensionsByWeight(6000)).toEqual({ length: 40, width: 30, height: 20 });
  });
});

describe("getItemDimensions", () => {
  it("returns dimensions from item when available", () => {
    const item: CartItem = {
      productId: 1, name: "Test", price: 100, quantity: 1,
      dimensions: { length: 30, width: 20, height: 10, weight: 2000 },
    };
    expect(getItemDimensions(item)).toEqual({ length: 30, width: 20, height: 10, weight: 2000 });
  });

  it("falls back to defaults when dimensions is undefined", () => {
    const item: CartItem = { productId: 1, name: "Test", price: 100, quantity: 1 };
    expect(getItemDimensions(item)).toEqual({ length: 20, width: 15, height: 10, weight: 500 });
  });

  it("falls back to defaults when dimensions has partial fields", () => {
    const item: CartItem = {
      productId: 1, name: "Test", price: 100, quantity: 1,
      dimensions: { weight: 1000 },
    };
    const dims = getItemDimensions(item);
    expect(dims.weight).toBe(1000);
    expect(dims.length).toBe(20);
    expect(dims.width).toBe(15);
    expect(dims.height).toBe(10);
  });
});

describe("getCartDimensions", () => {
  it("aggregates dimensions from multiple items", () => {
    const items: CartItem[] = [
      { productId: 1, name: "A", price: 100, quantity: 2, dimensions: { length: 25, width: 15, height: 10, weight: 800 } },
      { productId: 2, name: "B", price: 100, quantity: 1, dimensions: { length: 30, width: 20, height: 15, weight: 1500 } },
    ];
    const result = getCartDimensions(items);
    expect(result.weight).toBe(3100);
    expect(result.length).toBe(30);
    expect(result.width).toBe(20);
    expect(result.height).toBe(35);
  });

  it("returns zeros for empty items", () => {
    expect(getCartDimensions([])).toEqual({ weight: 0, length: 0, width: 0, height: 0 });
  });

  it("uses defaults for items without dimensions", () => {
    const items: CartItem[] = [
      { productId: 1, name: "A", price: 100, quantity: 2 },
    ];
    const result = getCartDimensions(items);
    expect(result.weight).toBe(1000);
    expect(result.length).toBe(20);
    expect(result.width).toBe(15);
    expect(result.height).toBe(20);
  });
});
