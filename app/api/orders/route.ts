import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createOrder, StrapiError } from "@/lib/orders";
import { computeDiscount, toVoucherRules, type VoucherRules } from "@/lib/vouchers";
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

async function fetchVoucherByDocumentId(documentId: string) {
  try {
    const res = await strapiFetch<{ data: Array<Partial<VoucherRules>> }>("/vouchers", {
      filters: { documentId: { $eq: documentId } },
    });

    return toVoucherRules(res.data?.[0] ?? null);
  } catch {
    return null;
  }
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
    const voucher = typeof body.voucherDocumentId === "string" ? await fetchVoucherByDocumentId(body.voucherDocumentId) : null;
    const discount = computeDiscount(voucher, Number(body.subtotal ?? 0));

    const order = await createOrder(
      {
        orderStatus: "pending",
        paymentStatus: "pending",
        subtotal: body.subtotal,
        tax: body.tax ?? 0,
        shippingCost: body.shippingCost ?? 0,
        discount,
        totalAmount: body.totalAmount,
        currency: body.currency || "IDR",
        notes: body.notes,
        items,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
        voucher: voucher?.documentId,
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
