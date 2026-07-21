import { NextResponse } from "next/server";

const DISABLED = { gateway: false, manualTransfer: false, bankAccounts: [] };

export async function GET() {
  try {
    const STRAPI_URL = process.env.STRAPI_URL!;
    const res = await fetch(`${STRAPI_URL}/api/store-setting/payment-methods`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ data: DISABLED });
    }
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ data: DISABLED });
  }
}
