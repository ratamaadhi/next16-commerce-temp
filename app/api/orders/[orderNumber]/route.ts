import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { strapiFetch } from "@/lib/strapi";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;
    if (!orderNumber) {
      return NextResponse.json({ error: "Missing order number" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await strapiFetch<{ data: Array<Record<string, unknown>> }>(
      "/orders",
      {
        filters: { orderNumber: { $eq: orderNumber } },
        populate: "*",
      },
      {},
      token,
    );

    const order = response.data?.[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("[GET /orders/orderNumber]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
