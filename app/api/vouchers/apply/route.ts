import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { computeDiscount, isVoucherCurrentlyValid, toVoucherRules } from "@/lib/vouchers";

const STRAPI_URL = process.env.STRAPI_URL!;

type VoucherResponse = {
  data?: Array<{
    documentId?: string;
    code?: string;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    maxDiscountAmount?: number | null;
    minPurchase?: number | null;
    usageLimit?: number | null;
    usageLimitPerUser?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    isActive?: boolean | null;
  }>;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const subtotal = Number(body?.subtotal);

    if (!code || !Number.isFinite(subtotal)) {
      return NextResponse.json({ valid: false, reason: "not_found", message: "Kode voucher tidak ditemukan" }, { status: 200 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${STRAPI_URL}/api/vouchers?filters[code][$eqi]=${encodeURIComponent(code)}`;
    const response = await fetch(url, { headers });
    const payload = (await response.json().catch(() => null)) as VoucherResponse | null;
    const voucher = toVoucherRules(payload?.data?.[0] ?? {});

    if (!voucher) {
      return NextResponse.json({ valid: false, reason: "not_found", message: "Kode voucher tidak ditemukan" }, { status: 200 });
    }

    const validation = isVoucherCurrentlyValid(voucher);
    if (!validation.valid) {
      return NextResponse.json({ valid: false, reason: validation.reason, message: validation.message }, { status: 200 });
    }

    const minPurchase = Number(voucher.minPurchase ?? 0);
    if (subtotal < minPurchase) {
      return NextResponse.json(
        { valid: false, reason: "min_purchase", message: `Minimal belanja Rp${minPurchase} untuk memakai voucher ini` },
        { status: 200 },
      );
    }

    const discountAmount = computeDiscount(voucher, subtotal);

    return NextResponse.json(
      {
        valid: true,
        voucherDocumentId: voucher.documentId,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountAmount,
        minPurchase,
        discountAmount,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ valid: false, reason: "not_found", message: "Kode voucher tidak ditemukan" }, { status: 200 });
  }
}
