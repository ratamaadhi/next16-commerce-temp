import { NextRequest, NextResponse } from "next/server";
import type { SubdistrictResult } from "@/lib/shipping";

const API_URL = "https://prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/coverage/allleveldistrict/search";
const API_KEY = "base64:RG/ODAHrZ33diOUid/6oRzkUEu1WBVnjKoqgSqle0gA=";
const AUTH_TOKEN = "Bearer 31106721|4waTRjcj0ZDevak4CKx46GAniyboU4fYrSPiEvbAe45ff6cc";
const DEVICE_ID = "U2FsdGVkX1-U4uV821rGO7TNJgiY2eH2ls7Izfik";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword");

  if (!keyword || keyword.length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const url = `${API_URL}?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "api-key": API_KEY,
        authorization: AUTH_TOKEN,
        "device-id": DEVICE_ID,
        "device-time-zone": "wib",
        origin: "https://app.kiriminaja.com",
        referer: "https://app.kiriminaja.com/",
        "user-agent": "next-commerce/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `KiriminAja API error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const results: SubdistrictResult[] = Array.isArray(data) ? data : (data.data ?? []);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[search-district] error:", error);
    return NextResponse.json({ error: "Gagal mencari lokasi" }, { status: 500 });
  }
}
