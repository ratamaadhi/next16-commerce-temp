import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import { ShippingOptions } from "../shipping-options";
import type { ShippingOption } from "@/lib/shipping";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const baseOption: ShippingOption = {
  service: "jne",
  name: "REG",
  price: 10000,
  etd: "2-3",
  etdNamed: "2-3 hari",
  cod: false,
  group: "regular",
};

function makePending() {
  let resolve!: (v: Response) => void;
  const promise = new Promise<Response>((r) => { resolve = r; });
  return { promise, resolve };
}

describe("ShippingOptions - stale fetch guard", () => {
  it("ignores late-arriving error from a superseded fetch when a newer fetch succeeds", async () => {
    const first = makePending();
    const second = makePending();

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    global.fetch = fetchMock as unknown as typeof fetch;

    const onSelect = vi.fn();

    const { rerender } = render(
      <ShippingOptions
        destinationId={1}
        weight={1000}
        length={20}
        width={15}
        height={10}
        onSelect={onSelect}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    rerender(
      <ShippingOptions
        destinationId={2}
        weight={1000}
        length={20}
        width={15}
        height={10}
        onSelect={onSelect}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      second.resolve(
        new Response(JSON.stringify([baseOption]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Pilih Kurir")).toBeInTheDocument();
    });

    await act(async () => {
      first.resolve(
        new Response(JSON.stringify({ error: "boom" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    expect(screen.queryByText("Gagal mengambil ongkos kirim")).not.toBeInTheDocument();
  });

  it("ignores late-arriving options from a superseded fetch", async () => {
    const first = makePending();
    const second = makePending();

    const staleOption: ShippingOption = { ...baseOption, name: "STALE" };
    const freshOption: ShippingOption = { ...baseOption, name: "FRESH" };

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    global.fetch = fetchMock as unknown as typeof fetch;

    const onSelect = vi.fn();

    const { rerender } = render(
      <ShippingOptions
        destinationId={1}
        weight={1000}
        length={20}
        width={15}
        height={10}
        onSelect={onSelect}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    rerender(
      <ShippingOptions
        destinationId={2}
        weight={1000}
        length={20}
        width={15}
        height={10}
        onSelect={onSelect}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      second.resolve(
        new Response(JSON.stringify([freshOption]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("FRESH")).toBeInTheDocument();
    });

    await act(async () => {
      first.resolve(
        new Response(JSON.stringify([staleOption]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    expect(screen.getByText("FRESH")).toBeInTheDocument();
    expect(screen.queryByText("STALE")).not.toBeInTheDocument();
  });
});
