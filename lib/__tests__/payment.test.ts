import { describe, expect, it } from "vitest";
import {
  validateProofFile,
  mapProofUploadError,
  resolveInitialMethod,
  PROOF_MAX_BYTES,
} from "@/lib/payment";

describe("validateProofFile", () => {
  it("accepts a valid jpeg under the size limit", () => {
    expect(validateProofFile({ type: "image/jpeg", size: 1000 })).toEqual({ ok: true });
  });

  it("rejects a non-image type", () => {
    const r = validateProofFile({ type: "application/pdf", size: 1000 });
    expect(r).toEqual({ ok: false, error: "Format file harus JPG, PNG, WEBP, atau GIF" });
  });

  it("rejects a file over 5MB", () => {
    const r = validateProofFile({ type: "image/png", size: PROOF_MAX_BYTES + 1 });
    expect(r).toEqual({ ok: false, error: "Ukuran file maksimal 5MB" });
  });
});

describe("mapProofUploadError", () => {
  it("maps the inactive-order message", () => {
    expect(mapProofUploadError("Order is no longer active")).toBe(
      "Pesanan ini kadaluarsa atau dibatalkan",
    );
  });

  it("maps the wrong-status message", () => {
    expect(mapProofUploadError("Cannot upload proof in current payment status")).toBe(
      "Upload tidak diizinkan pada status pembayaran saat ini",
    );
  });

  it("falls back to the original message", () => {
    expect(mapProofUploadError("Some other error")).toBe("Some other error");
  });

  it("falls back to a generic message when undefined", () => {
    expect(mapProofUploadError(undefined)).toBe("Gagal mengunggah bukti pembayaran");
  });
});

describe("resolveInitialMethod", () => {
  const banks = { gateway: true, manualTransfer: true, bankAccounts: [] };
  it("prefers gateway when both enabled", () => {
    expect(resolveInitialMethod(banks)).toBe("gateway");
  });
  it("returns manual_transfer when only manual enabled", () => {
    expect(resolveInitialMethod({ ...banks, gateway: false })).toBe("manual_transfer");
  });
  it("returns gateway when only gateway enabled", () => {
    expect(resolveInitialMethod({ ...banks, manualTransfer: false })).toBe("gateway");
  });
  it("returns null when none enabled", () => {
    expect(resolveInitialMethod({ gateway: false, manualTransfer: false, bankAccounts: [] })).toBeNull();
  });
});
