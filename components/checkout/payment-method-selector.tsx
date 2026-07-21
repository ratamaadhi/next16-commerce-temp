// components/checkout/payment-method-selector.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Landmark } from "lucide-react";
import { BankAccountList } from "@/components/checkout/bank-account-list";
import type { PaymentMethod, PaymentMethods } from "@/lib/payment";

interface Props {
  methods: PaymentMethods;
  value: PaymentMethod | null;
  onChange: (m: PaymentMethod) => void;
}

export function PaymentMethodSelector({ methods, value, onChange }: Props) {
  const both = methods.gateway && methods.manualTransfer;
  const none = !methods.gateway && !methods.manualTransfer;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Metode Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {none && (
          <p className="text-xs text-destructive">
            Belum ada metode pembayaran yang aktif. Silakan hubungi penjual.
          </p>
        )}

        {both && (
          <RadioGroup
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as PaymentMethod)}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
              <RadioGroupItem value="gateway" id="pm-gateway" />
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="text-sm">Pembayaran Online (Kartu / VA / E-wallet)</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
              <RadioGroupItem value="manual_transfer" id="pm-manual" />
              <Landmark className="size-4 text-muted-foreground" />
              <span className="text-sm">Transfer Bank Manual</span>
            </label>
          </RadioGroup>
        )}

        {!both && !none && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {value === "manual_transfer" ? (
              <Landmark className="size-4" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {value === "manual_transfer"
              ? "Transfer Bank Manual"
              : "Pembayaran Online"}
          </p>
        )}

        {value === "manual_transfer" && (
          <div className="space-y-2">
            <Label className="text-xs">Transfer ke salah satu rekening berikut:</Label>
            <BankAccountList accounts={methods.bankAccounts} />
            <p className="text-xs text-muted-foreground">
              Setelah pesanan dibuat, unggah bukti transfer di halaman pesanan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
