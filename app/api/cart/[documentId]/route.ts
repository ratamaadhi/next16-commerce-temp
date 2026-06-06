import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${STRAPI_URL}/api/carts/${documentId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json({ error: data || response.statusText }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${STRAPI_URL}/api/carts/${documentId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return NextResponse.json({ error: data || response.statusText }, { status: response.status });
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? { ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
