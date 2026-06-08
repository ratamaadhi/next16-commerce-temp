import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  ORDER_STATUS_TITLES,
  getStatusBadgeClass,
  getTimelineSteps,
} from "../constants";

describe("ORDER_STATUSES", () => {
  it("contains all order statuses", () => {
    expect(ORDER_STATUSES).toEqual([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });
});

describe("ORDER_STATUS_TITLES", () => {
  it("maps each status to a display title", () => {
    expect(ORDER_STATUS_TITLES.pending).toBe("Pending");
    expect(ORDER_STATUS_TITLES.processing).toBe("Processing");
    expect(ORDER_STATUS_TITLES.shipped).toBe("Dikirim");
    expect(ORDER_STATUS_TITLES.delivered).toBe("Selesai");
    expect(ORDER_STATUS_TITLES.cancelled).toBe("Dibatalkan");
  });
});

describe("getStatusBadgeClass", () => {
  it("returns amber classes for pending", () => {
    expect(getStatusBadgeClass("pending")).toContain("bg-amber-50");
    expect(getStatusBadgeClass("pending")).toContain("text-amber-700");
  });

  it("returns blue classes for processing", () => {
    expect(getStatusBadgeClass("processing")).toContain("bg-blue-50");
    expect(getStatusBadgeClass("processing")).toContain("text-blue-700");
  });

  it("returns purple classes for shipped", () => {
    expect(getStatusBadgeClass("shipped")).toContain("bg-purple-50");
    expect(getStatusBadgeClass("shipped")).toContain("text-purple-700");
  });

  it("returns green classes for delivered", () => {
    expect(getStatusBadgeClass("delivered")).toContain("bg-green-50");
    expect(getStatusBadgeClass("delivered")).toContain("text-green-700");
  });

  it("returns red classes for cancelled", () => {
    expect(getStatusBadgeClass("cancelled")).toContain("bg-red-50");
    expect(getStatusBadgeClass("cancelled")).toContain("text-red-700");
  });

  it("returns gray classes for unknown status", () => {
    expect(getStatusBadgeClass("unknown_xyz")).toContain("bg-muted");
    expect(getStatusBadgeClass("unknown_xyz")).toContain("text-muted-foreground");
  });
});

describe("getTimelineSteps", () => {
  it("returns 4 base steps in order", () => {
    const steps = getTimelineSteps();
    expect(steps).toHaveLength(4);
    expect(steps[0]).toMatchObject({ key: "pending", label: "Pending" });
    expect(steps[1]).toMatchObject({ key: "processing", label: "Processing" });
    expect(steps[2]).toMatchObject({ key: "shipped", label: "Dikirim" });
    expect(steps[3]).toMatchObject({ key: "delivered", label: "Selesai" });
  });

  it("marks steps as completed before current status", () => {
    const steps = getTimelineSteps("processing");
    expect(steps[0].completed).toBe(true);
    expect(steps[1].completed).toBe(false);
    expect(steps[2].completed).toBe(false);
    expect(steps[3].completed).toBe(false);
  });

  it("marks current step as active", () => {
    const steps = getTimelineSteps("processing");
    expect(steps[0].active).toBe(false);
    expect(steps[1].active).toBe(true);
    expect(steps[2].active).toBe(false);
    expect(steps[3].active).toBe(false);
  });

  it("does not return timeline for cancelled orders", () => {
    const steps = getTimelineSteps("cancelled");
    expect(steps).toEqual([]);
  });

  it("returns completed timeline for delivered", () => {
    const steps = getTimelineSteps("delivered");
    expect(steps.every((s) => s.completed)).toBe(true);
    expect(steps[3].active).toBe(true);
  });
});
