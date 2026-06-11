import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(
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

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const orderRes = await fetch(
      `${STRAPI_URL}/api/orders?filters[orderNumber][$eq]=${encodeURIComponent(orderNumber)}&populate=*`,
      { headers: authHeaders },
    );

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: orderRes.status },
      );
    }

    const orderData = await orderRes.json();
    const documentId = orderData.data?.[0]?.documentId;

    if (!documentId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const retryRes = await fetch(
      `${STRAPI_URL}/api/orders/${documentId}/retry`,
      { method: "POST", headers: authHeaders },
    );

    const retryData = await retryRes.json().catch(() => null);

    if (!retryRes.ok) {
      return NextResponse.json(
        { error: retryData?.error?.message || "Retry failed" },
        { status: retryRes.status },
      );
    }

    return NextResponse.json(retryData);
  } catch (error) {
    console.error("[POST /orders/retry]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
