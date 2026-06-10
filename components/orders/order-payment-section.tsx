"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface OrderPaymentSectionProps {
  orderNumber: string;
  paymentStatus: string;
  totalAmount: number;
  currency?: string;
  snapToken: string | null;
}

const POLL_INTERVAL = 3000;
const POLL_MAX = 10;

function getSnapScriptUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"
  );
}

function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"));
      return;
    }
    if ("snap" in window) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = getSnapScriptUrl();
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Snap.js"));
    document.head.appendChild(script);
  });
}

async function regenerateToken(orderNumber: string): Promise<string> {
  const res = await fetch(`/api/orders/${orderNumber}/regenerate-snap-token`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to regenerate token");
  }
  const data = await res.json();
  return data.snapToken || data.token || data.data?.midtransSnapToken || "";
}

function pollPaymentStatus(orderNumber: string, onPaid: () => void, onTimeout: () => void) {
  let attempts = 0;
  const interval = setInterval(async () => {
    attempts++;
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok) return;
      const data = await res.json();
      const status = data?.data?.paymentStatus;
      if (status === "paid") {
        clearInterval(interval);
        onPaid();
      }
    } catch {
      // ignore polling errors
    }
    if (attempts >= POLL_MAX) {
      clearInterval(interval);
      onTimeout();
    }
  }, POLL_INTERVAL);
}

export function OrderPaymentSection({
  orderNumber,
  paymentStatus,
  snapToken: initialToken,
}: OrderPaymentSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(initialToken);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(paymentStatus === "paid");

  const handlePay = useCallback(async () => {
    setLoading(true);
    try {
      await loadSnapScript();

      let token = snapToken;
      if (!token) {
        token = await regenerateToken(orderNumber);
        setSnapToken(token);
      }

      const snap = (
        window as unknown as {
          snap: {
            pay: (
              token: string,
              callbacks?: {
                onSuccess?: (result: unknown) => void;
                onPending?: (result: unknown) => void;
                onError?: (result: unknown) => void;
                onClose?: () => void;
              },
            ) => void;
          };
        }
      ).snap;

      snap.pay(token, {
        onSuccess: () => {
          setPolling(true);
          pollPaymentStatus(
            orderNumber,
            () => {
              setPaid(true);
              setPolling(false);
              router.refresh();
              toast.success("Pembayaran berhasil!");
            },
            () => {
              setPolling(false);
              router.refresh();
              toast.info("Pembayaran sedang diproses. Refresh halaman untuk status terbaru.");
            },
          );
        },
        onPending: () => {
          setPolling(true);
          pollPaymentStatus(
            orderNumber,
            () => {
              setPaid(true);
              setPolling(false);
              router.refresh();
            },
            () => {
              setPolling(false);
            },
          );
        },
        onError: async () => {
          toast.error("Pembayaran gagal. Mencoba generate token baru...");
          try {
            const newToken = await regenerateToken(orderNumber);
            setSnapToken(newToken);
            toast.success("Token baru tersedia. Silakan coba bayar lagi.");
          } catch {
            toast.error("Gagal generate token baru. Silakan coba lagi.");
          }
        },
        onClose: () => {
          toast.info("Popup pembayaran ditutup. Anda dapat membayar kembali nanti.");
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat pembayaran";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [snapToken, orderNumber, router]);

  if (paid) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pembayaran</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Lunas
          </Badge>
        </div>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pembayaran</span>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Memproses...
          </Badge>
        </div>
      </div>
    );
  }

  const isFailed = paymentStatus === "failed";

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Pembayaran</span>
        <Badge
          variant="outline"
          className={
            isFailed
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }
        >
          {isFailed ? "Gagal" : "Pending"}
        </Badge>
      </div>
      <Button onClick={handlePay} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </span>
        ) : (
          <span className="flex items-center">
            {isFailed ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {isFailed ? "Coba Bayar Lagi" : "Bayar Sekarang"}
          </span>
        )}
      </Button>
    </div>
  );
}
