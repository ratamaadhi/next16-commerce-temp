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
  }> = {},
) {
  return render(
    <OrderPaymentSection
      orderNumber={overrides.orderNumber ?? "ORD-001"}
      paymentStatus={overrides.paymentStatus ?? "pending"}
      totalAmount={overrides.totalAmount ?? 50000}
      snapToken={overrides.snapToken ?? "test-snap-token"}
    />,
  );
}

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
