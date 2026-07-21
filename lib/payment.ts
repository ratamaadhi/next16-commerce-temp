export type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string | null;
};

export type PaymentMethods = {
  gateway: boolean;
  manualTransfer: boolean;
  bankAccounts: BankAccount[];
};

export type PaymentMethod = "gateway" | "manual_transfer";

export type ManualPaymentStatus =
  | "awaiting_proof"
  | "under_review"
  | "approved"
  | "rejected";

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export const PROOF_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function validateProofFile(
  file: { type: string; size: number },
): { ok: true } | { ok: false; error: string } {
  if (!PROOF_ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: "Format file harus JPG, PNG, WEBP, atau GIF" };
  }
  if (file.size > PROOF_MAX_BYTES) {
    return { ok: false, error: "Ukuran file maksimal 5MB" };
  }
  return { ok: true };
}

export function mapProofUploadError(message: string | undefined): string {
  if (!message) return "Gagal mengunggah bukti pembayaran";
  if (message.includes("no longer active")) {
    return "Pesanan ini kadaluarsa atau dibatalkan";
  }
  if (message.includes("current payment status")) {
    return "Upload tidak diizinkan pada status pembayaran saat ini";
  }
  return message;
}

export function resolveInitialMethod(m: PaymentMethods): PaymentMethod | null {
  if (m.gateway) return "gateway";
  if (m.manualTransfer) return "manual_transfer";
  return null;
}
