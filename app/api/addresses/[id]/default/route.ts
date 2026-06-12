import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}/make-default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to set default address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
