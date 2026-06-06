import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, type CartItem } from "../use-cart";

// Reset store between tests
beforeEach(() => {
  useCartStore.setState({
    items: [],
    cartDocumentId: null,
    sessionId: null,
  });
});

describe("useCartStore — existing behavior", () => {
  it("adds items to cart", () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: "Product A",
      price: 100,
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("increments quantity for duplicate product+variant", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1" });
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1" });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes item by productId and variantId", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1" });
    useCartStore.getState().removeItem(1, "v1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().updateQuantity(1, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("gets total", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, quantity: 2 });
    useCartStore.getState().addItem({ productId: 2, name: "B", price: 50, quantity: 1 });
    expect(useCartStore.getState().getTotal()).toBe(250);
  });

  it("gets item count", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, quantity: 3 });
    useCartStore.getState().addItem({ productId: 2, name: "B", price: 50, quantity: 2 });
    expect(useCartStore.getState().getItemCount()).toBe(5);
  });

  it("clears cart", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("useCartStore — new sessionId and cartDocumentId", () => {
  it("has null sessionId by default", () => {
    expect(useCartStore.getState().sessionId).toBeNull();
  });

  it("has null cartDocumentId by default", () => {
    expect(useCartStore.getState().cartDocumentId).toBeNull();
  });

  it("setSessionId updates sessionId", () => {
    useCartStore.getState().setSessionId("session-123");
    expect(useCartStore.getState().sessionId).toBe("session-123");
  });

  it("setCartDocumentId updates cartDocumentId", () => {
    useCartStore.getState().setCartDocumentId("doc-456");
    expect(useCartStore.getState().cartDocumentId).toBe("doc-456");
  });
});

describe("useCartStore — setItems and mergeItems", () => {
  it("setItems replaces all items", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    const newItems: CartItem[] = [
      { productId: 2, name: "B", price: 200, quantity: 1 },
    ];
    useCartStore.getState().setItems(newItems);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe("B");
  });

  it("mergeItems deduplicates by variantId and sums quantities", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1", quantity: 2 });
    const incoming: CartItem[] = [
      { productId: 1, name: "A", price: 100, variantId: "v1", quantity: 3 },
      { productId: 2, name: "B", price: 200, variantId: "v2", quantity: 1 },
    ];
    useCartStore.getState().mergeItems(incoming);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    const itemA = items.find((i) => i.variantId === "v1")!;
    expect(itemA.quantity).toBe(5); // 2 + 3
    const itemB = items.find((i) => i.variantId === "v2")!;
    expect(itemB.quantity).toBe(1);
  });

  it("mergeItems handles empty incoming", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().mergeItems([]);
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

describe("useCartStore — mergeCart", () => {
  it("replaces items with merged result and updates cartDocumentId", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1", quantity: 2 });
    const serverItems: CartItem[] = [
      { productId: 1, name: "A", price: 100, variantId: "v1", quantity: 1 },
      { productId: 2, name: "B", price: 200, variantId: "v2", quantity: 3 },
    ];

    useCartStore.getState().mergeCart("server-cart-doc", serverItems);
    const items = useCartStore.getState().items;
    const total = items.reduce((s, i) => s + i.quantity, 0);
    expect(total).toBe(6); // 2+1 + 3 = 6
    expect(useCartStore.getState().cartDocumentId).toBe("server-cart-doc");
  });
});

describe("useCartStore — replaceCart", () => {
  it("replaces items completely and updates cartDocumentId", () => {
    useCartStore.getState().setSessionId("session-keep");
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().replaceCart("new-doc", [
      { productId: 3, name: "C", price: 300, quantity: 1 },
    ]);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe("C");
    expect(useCartStore.getState().cartDocumentId).toBe("new-doc");
    expect(useCartStore.getState().sessionId).toBe("session-keep");
  });
});

describe("useCartStore — getTotalWeight", () => {
  it("sums weight * quantity for all items", () => {
    useCartStore.getState().addItem({
      productId: 1, name: "A", price: 100, quantity: 2, weight: 300,
    });
    useCartStore.getState().addItem({
      productId: 2, name: "B", price: 100, quantity: 3, weight: 200,
    });
    expect(useCartStore.getState().getTotalWeight()).toBe(1200); // 600 + 600
  });

  it("uses default 500g when weight is undefined", () => {
    useCartStore.getState().addItem({
      productId: 1, name: "A", price: 100, quantity: 2,
    });
    expect(useCartStore.getState().getTotalWeight()).toBe(1000);
  });

  it("returns 0 for empty cart", () => {
    expect(useCartStore.getState().getTotalWeight()).toBe(0);
  });
});

describe("useCartStore — getTotalWeight with dimensions", () => {
  it("prefers dimensions.weight over flat weight", () => {
    useCartStore.getState().setItems([
      {
        productId: 1, name: "A", price: 100, quantity: 2,
        weight: 100, dimensions: { weight: 300 },
      },
    ]);
    expect(useCartStore.getState().getTotalWeight()).toBe(600);
  });

  it("falls back to flat weight when dimensions has no weight", () => {
    useCartStore.getState().setItems([
      {
        productId: 1, name: "A", price: 100, quantity: 2,
        weight: 300, dimensions: { length: 20, width: 15, height: 10 },
      },
    ]);
    expect(useCartStore.getState().getTotalWeight()).toBe(600);
  });

  it("falls back to 500 when neither dimensions.weight nor weight exists", () => {
    useCartStore.getState().setItems([
      { productId: 1, name: "A", price: 100, quantity: 2 },
    ]);
    expect(useCartStore.getState().getTotalWeight()).toBe(1000);
  });
});
