import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, act, cleanup, fireEvent } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import { OrderPaymentSection } from "../order-payment-section";

function setupSnap(callbacksContainer: { current: Record<string, unknown> | null }) {
  (window as Record<string, unknown>).snap = {
    pay: vi.fn((_token: string, callbacks: Record<string, unknown>) => {
      callbacksContainer.current = callbacks;
    }),
  };
}

function mockFetch(status = "pending") {
  (globalThis as Record<string, unknown>).fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: { paymentStatus: status } }),
  });
}

function renderSection(
  overrides: Partial<{
    orderNumber: string;
    paymentStatus: string;
    totalAmount: number;
    snapToken: string | null;
    autoPay?: boolean;
  }> = {},
) {
  return render(
    <OrderPaymentSection
      orderNumber={overrides.orderNumber ?? "ORD-001"}
      paymentStatus={overrides.paymentStatus ?? "pending"}
      totalAmount={overrides.totalAmount ?? 50000}
      snapToken={overrides.snapToken ?? "test-snap-token"}
      autoPay={overrides.autoPay}
    />,
  );
}

describe("OrderPaymentSection — retry flow", () => {
  let snapCallbacks: { current: Record<string, unknown> | null };

  beforeEach(() => {
    snapCallbacks = { current: null };
    setupSnap(snapCallbacks);
    mockFetch("pending");
  });

  it('renders "Coba Bayar Lagi" button and "Gagal" badge when failed', () => {
    renderSection({ paymentStatus: "failed", snapToken: null });
    expect(screen.getByText("Coba Bayar Lagi")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.queryByText("Bayar Sekarang")).not.toBeInTheDocument();
  });

  it("calls retry API endpoint when Coba Bayar Lagi is clicked", async () => {
    (globalThis as Record<string, unknown>).fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { orderNumber: "ORD-NEW-123", documentId: "doc-new" },
          }),
      });

    renderSection({ paymentStatus: "failed", snapToken: null });

    fireEvent.click(screen.getByText("Coba Bayar Lagi"));

    await waitFor(() => {
      const calls = (globalThis as Record<string, unknown>)
        .fetch as ReturnType<typeof vi.fn>;
      expect(calls).toHaveBeenCalledWith(
        "/api/orders/ORD-001/retry",
        { method: "POST" },
      );
    });
  });

  it("shows error toast on retry API failure", async () => {
    (globalThis as Record<string, unknown>).fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ error: "Maximum retry limit exceeded" }),
      });

    const { toast } = await import("sonner");

    renderSection({ paymentStatus: "failed", snapToken: null });

    fireEvent.click(screen.getByText("Coba Bayar Lagi"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Maximum retry limit exceeded",
      );
    });
  });

  it("shows spinner on retry button while processing", async () => {
    let resolvePromise: (v: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis as Record<string, unknown>).fetch = vi
      .fn()
      .mockReturnValueOnce(fetchPromise);

    renderSection({ paymentStatus: "failed", snapToken: null });

    fireEvent.click(screen.getByText("Coba Bayar Lagi"));

    await waitFor(() => {
      expect(screen.getByText("Memproses...")).toBeInTheDocument();
    });

    resolvePromise!({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Failed" }),
    });

    await waitFor(() => {
      expect(screen.getByText("Coba Bayar Lagi")).toBeInTheDocument();
    });
  });

  it("auto-triggers snap.pay on mount when autoPay prop is true", async () => {
    const snap = (window as Record<string, unknown>).snap as {
      pay: ReturnType<typeof vi.fn>;
    };

    renderSection({
      paymentStatus: "pending",
      snapToken: "test-snap-token",
      autoPay: true,
    });

    await waitFor(() => {
      expect(snap.pay).toHaveBeenCalled();
    });
  });

  it("does not auto-trigger when snapToken is null even with autoPay", async () => {
    const snap = (window as Record<string, unknown>).snap as {
      pay: ReturnType<typeof vi.fn>;
    };

    renderSection({
      paymentStatus: "pending",
      snapToken: null,
      autoPay: true,
    });

    await waitFor(() => {
      expect(snap.pay).not.toHaveBeenCalled();
    });
  });
});

describe("OrderPaymentSection — Snap onClose clears polling", () => {
  let snapCallbacks: { current: Record<string, unknown> | null };

  beforeEach(() => {
    snapCallbacks = { current: null };
    setupSnap(snapCallbacks);
    mockFetch("pending");
  });

  it('shows "Bayar Sekarang" button after user closes Snap popup (onClose clears polling)', async () => {
    renderSection();

    expect(screen.getByText("Bayar Sekarang")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Bayar Sekarang"));

    await waitFor(() => {
      expect((window as Record<string, unknown>).snap).toBeDefined();
    });

    await act(async () => {
      (snapCallbacks.current?.onPending as () => void)?.();
    });

    expect(screen.getByText("Memproses...")).toBeInTheDocument();
    expect(screen.queryByText("Bayar Sekarang")).not.toBeInTheDocument();

    await act(async () => {
      (snapCallbacks.current?.onClose as () => void)?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Bayar Sekarang")).toBeInTheDocument();
    });
    expect(screen.queryByText("Memproses...")).not.toBeInTheDocument();
  });

  it("clears the polling interval when onClose fires", async () => {
    let capturedIntervalId: number | null = null;
    const originalSetInterval = window.setInterval;
    const setIntervalSpy = vi.spyOn(window, "setInterval").mockImplementation((fn, ms, ...args) => {
      const id = originalSetInterval(fn, ms, ...args);
      capturedIntervalId = id as unknown as number;
      return id;
    });
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");

    renderSection();

    fireEvent.click(screen.getByText("Bayar Sekarang"));

    await waitFor(() => {
      expect((window as Record<string, unknown>).snap).toBeDefined();
    });

    await act(async () => {
      (snapCallbacks.current?.onPending as () => void)?.();
    });

    await act(async () => {
      (snapCallbacks.current?.onClose as () => void)?.();
    });

    expect(clearIntervalSpy).toHaveBeenCalledWith(capturedIntervalId);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
