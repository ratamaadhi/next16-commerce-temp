"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  autoPay?: boolean;
}

const POLL_INTERVAL = 5000;
const POLL_MAX = 3;

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

function pollPaymentStatus(
  orderNumber: string,
  onPaid: () => void,
  onTimeout: () => void,
  intervalRef: { current: ReturnType<typeof setInterval> | null },
) {
  if (intervalRef.current !== null) {
    clearInterval(intervalRef.current);
  }
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
        intervalRef.current = null;
        onPaid();
      }
    } catch {
      // ignore polling errors
    }
    if (attempts >= POLL_MAX) {
      clearInterval(interval);
      intervalRef.current = null;
      onTimeout();
    }
  }, POLL_INTERVAL);
  intervalRef.current = interval;
}

export function OrderPaymentSection({
  orderNumber,
  paymentStatus,
  snapToken: initialToken,
  autoPay,
}: OrderPaymentSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(initialToken);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(paymentStatus === "paid");
  const [retrying, setRetrying] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoPaid = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  }, []);

  const handlePay = useCallback(async () => {
    stopPolling();
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
            pollIntervalRef,
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
            pollIntervalRef,
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
          stopPolling();
          toast.info("Popup pembayaran ditutup. Anda dapat membayar kembali nanti.");
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat pembayaran";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [snapToken, orderNumber, router, stopPolling]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoPay && snapToken && !hasAutoPaid.current) {
      hasAutoPaid.current = true;
      handlePay();
    }
  }, []);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    setRetrying(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memproses retry");
      }
      const data = await res.json();
      const newOrderNumber = data.data?.orderNumber;
      if (!newOrderNumber) throw new Error("Gagal memproses retry");
      window.location.href = `/orders/${newOrderNumber}?autoPay=true`;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memproses retry";
      toast.error(message);
      setLoading(false);
      setRetrying(false);
    }
  }, [orderNumber]);

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
      <Button
        onClick={isFailed ? handleRetry : handlePay}
        disabled={loading}
        className="w-full"
        size="lg">
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
