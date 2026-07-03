export interface VoucherRules {
  documentId: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minPurchase?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
}

export type VoucherInvalidReason = "inactive" | "not_started" | "expired";

export function computeDiscount(voucher: VoucherRules | null, subtotal: number): number {
  if (!voucher || subtotal <= 0) return 0;

  const minPurchase = Number(voucher.minPurchase ?? 0);
  if (subtotal < minPurchase) return 0;

  const discountValue = Number(voucher.discountValue ?? 0);
  let discount = voucher.discountType === "percentage" ? subtotal * (discountValue / 100) : discountValue;

  if (voucher.discountType === "percentage" && voucher.maxDiscountAmount != null) {
    discount = Math.min(discount, Number(voucher.maxDiscountAmount));
  }

  return Math.round(Math.min(discount, subtotal));
}

export function isVoucherCurrentlyValid(
  voucher: VoucherRules,
  now = new Date(),
): { valid: true } | { valid: false; reason: VoucherInvalidReason; message: string } {
  if (voucher.isActive === false) {
    return { valid: false, reason: "inactive", message: "Voucher tidak aktif" };
  }

  if (voucher.startDate && now < new Date(voucher.startDate)) {
    return { valid: false, reason: "not_started", message: "Voucher belum berlaku" };
  }

  if (voucher.endDate && now > new Date(voucher.endDate)) {
    return { valid: false, reason: "expired", message: "Voucher sudah kadaluarsa" };
  }

  return { valid: true };
}

export function toVoucherRules(input: {
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
}): VoucherRules | null {
  if (!input.documentId || !input.code || !input.discountType || input.discountValue == null) {
    return null;
  }

  return {
    documentId: input.documentId,
    code: input.code,
    discountType: input.discountType,
    discountValue: input.discountValue,
    maxDiscountAmount: input.maxDiscountAmount ?? null,
    minPurchase: input.minPurchase ?? 0,
    usageLimit: input.usageLimit ?? null,
    usageLimitPerUser: input.usageLimitPerUser ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    isActive: input.isActive ?? true,
  };
}
