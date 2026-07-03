import { describe, expect, it } from "vitest";
import { computeDiscount, isVoucherCurrentlyValid, toVoucherRules, type VoucherRules } from "../vouchers";

describe("computeDiscount", () => {
  it("computes percentage discount", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 200000)).toBe(20000);
  });

  it("caps percentage discount with maxDiscountAmount", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "HEMAT50",
      discountType: "percentage",
      discountValue: 50,
      maxDiscountAmount: 30000,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 200000)).toBe(30000);
  });

  it("computes fixed discount", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "POTONG20K",
      discountType: "fixed",
      discountValue: 20000,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 150000)).toBe(20000);
  });

  it("clamps fixed discount to subtotal", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "POTONG200K",
      discountType: "fixed",
      discountValue: 200000,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 150000)).toBe(150000);
  });

  it("returns 0 when subtotal is below minPurchase", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "MIN100K",
      discountType: "fixed",
      discountValue: 20000,
      minPurchase: 100000,
    };

    expect(computeDiscount(voucher, 50000)).toBe(0);
  });
});

describe("isVoucherCurrentlyValid", () => {
  it("accepts active voucher within date range", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "AKTIF",
      discountType: "fixed",
      discountValue: 10000,
      minPurchase: 0,
      isActive: true,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.999Z",
    };

    expect(isVoucherCurrentlyValid(voucher, new Date("2026-07-03T00:00:00.000Z"))).toEqual({
      valid: true,
    });
  });

  it("rejects inactive voucher", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "MATI",
      discountType: "fixed",
      discountValue: 10000,
      minPurchase: 0,
      isActive: false,
    };

    expect(isVoucherCurrentlyValid(voucher, new Date("2026-07-03T00:00:00.000Z"))).toEqual({
      valid: false,
      reason: "inactive",
      message: "Voucher tidak aktif",
    });
  });

  it("rejects voucher that has not started yet", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "BELUM",
      discountType: "fixed",
      discountValue: 10000,
      minPurchase: 0,
      isActive: true,
      startDate: "2026-08-01T00:00:00.000Z",
    };

    expect(isVoucherCurrentlyValid(voucher, new Date("2026-07-03T00:00:00.000Z"))).toEqual({
      valid: false,
      reason: "not_started",
      message: "Voucher belum berlaku",
    });
  });

  it("rejects expired voucher", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "HABIS",
      discountType: "fixed",
      discountValue: 10000,
      minPurchase: 0,
      isActive: true,
      endDate: "2026-06-30T23:59:59.999Z",
    };

    expect(isVoucherCurrentlyValid(voucher, new Date("2026-07-03T00:00:00.000Z"))).toEqual({
      valid: false,
      reason: "expired",
      message: "Voucher sudah kadaluarsa",
    });
  });
});

describe("toVoucherRules", () => {
  it("normalizes voucher input", () => {
    expect(
      toVoucherRules({
        documentId: "voucher-1",
        code: "HEMAT10",
        discountType: "percentage",
        discountValue: 10,
      }),
    ).toEqual({
      documentId: "voucher-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      maxDiscountAmount: null,
      minPurchase: 0,
      usageLimit: null,
      usageLimitPerUser: null,
      startDate: null,
      endDate: null,
      isActive: true,
    });
  });

  it("returns null when required fields are missing", () => {
    expect(toVoucherRules({ code: "HEMAT10" })).toBeNull();
  });
});
