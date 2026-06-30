import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await params;

    const res = await fetch(`${STRAPI_URL}/api/wishlist-items/${documentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
