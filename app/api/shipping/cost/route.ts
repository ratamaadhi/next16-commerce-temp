import { NextRequest, NextResponse } from "next/server";
import type { ShippingOption } from "@/lib/shipping";

interface RawShippingItem {
  service: string;
  service_name: string;
  cost: string;
  etd: string;
  etd_named: string;
  image_link?: string;
  cod: boolean;
  group: string;
}

const API_URL = "https://prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/shipping/express";
const API_KEY = "base64:RG/ODAHrZ33diOUid/6oRzkUEu1WBVnjKoqgSqle0gA=";
const AUTH_TOKEN = "Bearer 31106721|4waTRjcj0ZDevak4CKx46GAniyboU4fYrSPiEvbAe45ff6cc";
const DEVICE_ID = "U2FsdGVkX1-U4uV821rGO7TNJgiY2eH2ls7Izfik";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subdistrictDestination = searchParams.get("subdistrict_destination");
  const destinationTitle = searchParams.get("destinationTitle") || "";
  const weight = searchParams.get("weight") || "2000";
  const length = searchParams.get("length") || "27";
  const width = searchParams.get("width") || "13";
  const height = searchParams.get("height") || "7";

  const originId = process.env.KIRIMINAJA_ORIGIN_SUBDISTRICT_ID || "5470";
  const originTitle = process.env.KIRIMINAJA_ORIGIN_TITLE || "Origin";

  if (!subdistrictDestination) {
    return NextResponse.json({ error: "subdistrict_destination is required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      subdistrict_origin: originId,
      subdistrict_destination: subdistrictDestination,
      originTitle,
      destinationTitle,
      weight,
      length,
      width,
      height,
      insurance: "false",
      cod: "false",
      item_value: "0",
    });

    const url = `${API_URL}?${params.toString()}`;
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
    const raw: RawShippingItem[] = Array.isArray(data) ? data : (data.data ?? []);

    const results: ShippingOption[] = raw.map((item) => ({
      service: item.service,
      name: item.service_name,
      price: parseInt(item.cost, 10),
      etd: item.etd,
      etdNamed: item.etd_named,
      imageUrl: item.image_link,
      cod: item.cod,
      group: item.group,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("[shipping-cost] error:", error);
    return NextResponse.json({ error: "Gagal mengambil ongkos kirim" }, { status: 500 });
  }
}
