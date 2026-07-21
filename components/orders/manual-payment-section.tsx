"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { BankAccountList } from "@/components/checkout/bank-account-list";
import { ProofUploadForm } from "@/components/orders/proof-upload-form";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import type { ManualPaymentStatus } from "@/lib/payment";

export function ManualPaymentSection({
  orderDocumentId,
  status,
  rejectionReason,
}: {
  orderDocumentId: string;
  status: ManualPaymentStatus | null;
  rejectionReason: string | null;
}) {
  const { methods } = usePaymentMethods();
  const effective = status ?? "awaiting_proof";
  const showForm = effective === "awaiting_proof" || effective === "rejected";

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Pembayaran</span>
        {effective === "approved" ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Terkonfirmasi
          </Badge>
        ) : effective === "under_review" ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Menunggu Verifikasi
          </Badge>
        ) : effective === "rejected" ? (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Ditolak
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Upload className="mr-1 h-3 w-3" />
            Menunggu Bukti
          </Badge>
        )}
      </div>

      {effective === "approved" && (
        <p className="text-xs text-green-700">
          Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses.
        </p>
      )}

      {effective === "under_review" && (
        <p className="text-xs text-muted-foreground">
          Bukti transfer diterima. Menunggu verifikasi admin.
        </p>
      )}

      {effective === "rejected" && rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <p className="font-medium">Bukti ditolak:</p>
          <p>{rejectionReason}</p>
        </div>
      )}

      {showForm && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {effective === "rejected"
                ? "Silakan unggah ulang bukti transfer:"
                : "Transfer ke salah satu rekening berikut, lalu unggah bukti:"}
            </p>
            {methods?.bankAccounts?.length ? (
              <BankAccountList accounts={methods.bankAccounts} />
            ) : null}
          </div>
          <ProofUploadForm orderDocumentId={orderDocumentId} />
        </>
      )}
    </div>
  );
}
