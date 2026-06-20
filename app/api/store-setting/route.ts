import { NextResponse } from "next/server";

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337";

export async function GET() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/store-setting`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ data: { whatsappNumber: null } });
    }
    const json = await res.json();
    return NextResponse.json({
      data: { whatsappNumber: json.data?.whatsappNumber ?? null },
    });
  } catch {
    return NextResponse.json({ data: { whatsappNumber: null } });
  }
}
