import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ data: [] });
  }

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) {
      return NextResponse.json({ data: [] });
    }
    const me = await meRes.json();

    const res = await fetch(
      `${STRAPI_URL}/api/wishlist-items?filters[user][id][$eq]=${me.id}&populate[0]=product.images`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productDocumentId } = body;

    if (!productDocumentId) {
      return NextResponse.json({ error: "productDocumentId is required" }, { status: 400 });
    }

    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();

    const res = await fetch(`${STRAPI_URL}/api/wishlist-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          product: productDocumentId,
          user: me.id,
        },
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(json, { status: res.status });
    }

    return NextResponse.json(json, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
