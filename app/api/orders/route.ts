import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOrder, StrapiError } from "@/lib/orders";
import { strapiFetch } from "@/lib/strapi";

async function resolveItemDocumentIds(items: Array<Record<string, unknown>>) {
  return Promise.all(
    items.map(async (item) => {
      if (item.productDocumentId) return item;
      const productId = String(item.productId);
      if (!productId) return item;
      try {
        const res = await strapiFetch<{ data: { documentId: string }[] }>("/products", {
          filters: { id: { $eq: productId } },
        });
        const docId = res.data?.[0]?.documentId;
        if (!docId) return item;
        return { ...item, productDocumentId: docId };
      } catch {
        return item;
      }
    }),
  );
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const items = await resolveItemDocumentIds(body.items);

    const order = await createOrder(
      {
        orderStatus: "pending",
        paymentStatus: "pending",
        subtotal: body.subtotal,
        tax: body.tax ?? 0,
        shippingCost: body.shippingCost ?? 0,
        discount: body.discount ?? 0,
        totalAmount: body.totalAmount,
        currency: body.currency || "IDR",
        notes: body.notes,
        items,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      },
      token,
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof StrapiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
