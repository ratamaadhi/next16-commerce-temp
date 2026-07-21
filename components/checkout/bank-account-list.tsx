"use client";

import { useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import type { BankAccount } from "@/lib/payment";

export function BankAccountList({ accounts }: { accounts: BankAccount[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied((c) => (c === value ? null : c)), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  if (!accounts.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada rekening bank yang tersedia. Hubungi penjual.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((acc, idx) => (
        <div key={idx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Landmark className="size-3.5 text-muted-foreground" />
            {acc.bankName}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm tabular-nums">{acc.accountNumber}</span>
            <button
              type="button"
              onClick={() => copy(acc.accountNumber)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
            >
              {copied === acc.accountNumber ? (
                <>
                  <Check className="size-3" /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Salin
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">a.n. {acc.accountHolder}</p>
          {acc.instructions && (
            <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5 whitespace-pre-line">
              {acc.instructions}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
