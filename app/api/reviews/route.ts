import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createReview, type ReviewSubmission, StrapiError } from "@/lib/reviews";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReviewSubmission = await req.json();

    if (!body.rating || !body.title || !body.comment || !body.productDocumentId || !body.orderNumber) {
      return NextResponse.json(
        { error: "Missing required fields: rating, title, comment, productDocumentId, orderNumber" },
        { status: 400 },
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (body.title.length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const orderRes = await fetch(
      `${STRAPI_URL}/api/orders?filters[orderNumber][$eq]=${encodeURIComponent(body.orderNumber)}&populate=*`,
      { headers: authHeaders },
    );

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: orderRes.status },
      );
    }

    const orderData = await orderRes.json();
    const order = orderData.data?.[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.orderStatus !== "delivered") {
      return NextResponse.json(
        { error: "Only delivered orders can be reviewed" },
        { status: 403 },
      );
    }

    const itemMatch = order.items?.some(
      (item: { productDocumentId?: string }) =>
        item.productDocumentId === body.productDocumentId,
    );

    if (!itemMatch) {
      return NextResponse.json(
        { error: "Product not found in this order" },
        { status: 403 },
      );
    }

    const review = await createReview(
      {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        reviewStatus: "pending",
        product: body.productDocumentId,
      },
      token,
    );

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof StrapiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }
    console.error("[POST /api/reviews]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
