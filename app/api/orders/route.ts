import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const response = await fetch(`${STRAPI_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          orderNumber,
          orderStatus: "pending",
          paymentStatus: "pending",
          subtotal: body.subtotal,
          tax: 0,
          shippingCost: body.shippingCost ?? 0,
          discount: 0,
          totalAmount: body.totalAmount,
          currency: body.currency || "IDR",
          notes: body.notes,
          items: body.items,
          shippingAddress: body.shippingAddress,
          billingAddress: body.billingAddress,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const order = await response.json();
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
