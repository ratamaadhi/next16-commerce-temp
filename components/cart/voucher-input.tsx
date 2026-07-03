"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/strapi";
import type { VoucherRules } from "@/lib/vouchers";
import { X } from "lucide-react";
import { toast } from "sonner";

type VoucherApplyResponse = {
  valid: boolean;
  message: string;
  voucherDocumentId?: string;
  code?: string;
  discountType?: VoucherRules["discountType"];
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minPurchase?: number | null;
  discountAmount?: number;
};

export function VoucherInput() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const appliedVoucher = useCartStore((s) => s.appliedVoucher);
  const setAppliedVoucher = useCartStore((s) => s.setAppliedVoucher);
  const getTotal = useCartStore((s) => s.getTotal);
  const getDiscount = useCartStore((s) => s.getDiscount);

  const handleApply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      toast.error("Masukkan kode voucher");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode, subtotal: getTotal() }),
      });

      const data = (await response.json()) as VoucherApplyResponse;

      if (!response.ok || !data.valid) {
        toast.error(data.message || "Voucher tidak valid");
        return;
      }

      if (!data.voucherDocumentId || !data.code || !data.discountType || data.discountValue == null) {
        toast.error("Voucher tidak valid");
        return;
      }

      setAppliedVoucher({
        documentId: data.voucherDocumentId,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        minPurchase: data.minPurchase ?? 0,
      });
      setCode("");
      toast.success(data.message || "Voucher diterapkan");
    } catch {
      toast.error("Gagal menerapkan voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedVoucher(null);
  };

  if (appliedVoucher) {
    const discount = getDiscount();
    const minPurchase = appliedVoucher.minPurchase ?? 0;

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1">
            <span className="font-medium uppercase tracking-wide">{appliedVoucher.code}</span>
            <span className="text-xs text-muted-foreground">
              {discount > 0 ? `-${formatPrice(discount)}` : "Applied"}
            </span>
          </Badge>
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove} aria-label="Hapus voucher">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {discount === 0 && minPurchase > 0 ? (
          <p className="text-xs text-muted-foreground">
            Minimum belanja {formatPrice(minPurchase)} untuk memakai voucher ini.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Masukkan kode voucher"
          autoComplete="off"
        />
        <Button type="submit" disabled={loading}>
          Terapkan
        </Button>
      </div>
    </form>
  );
}
