import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOrder, StrapiError } from "@/lib/orders";
import { decrementInventory } from "@/lib/inventory";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const order = await createOrder(
      {
        orderNumber,
        orderStatus: "pending",
        paymentStatus: "pending",
        subtotal: body.subtotal,
        tax: body.tax ?? 0,
        shippingCost: body.shippingCost ?? 0,
        discount: body.discount ?? 0,
        totalAmount: body.totalAmount,
        currency: body.currency || "IDR",
        notes: body.notes,
        items: body.items,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      },
      token,
    );

    const inventoryItems = (body.items as Array<Record<string, unknown>>).map(
      (item) => ({
        productDocumentId: String(item.productDocumentId),
        variantSku: item.variantSku ? String(item.variantSku) : undefined,
        quantity: parseInt(String(item.quantity), 10),
      }),
    );
    decrementInventory(inventoryItems, token).catch((err) => {
      console.error("[orders] Failed to decrement inventory:", err);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof StrapiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
