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
  it("returns muted classes for pending", () => {
    expect(getStatusBadgeClass("pending")).toContain("bg-muted");
    expect(getStatusBadgeClass("pending")).toContain("text-muted-foreground");
  });

  it("returns primary classes for processing", () => {
    expect(getStatusBadgeClass("processing")).toContain("bg-primary");
    expect(getStatusBadgeClass("processing")).toContain("text-primary");
  });

  it("returns accent classes for shipped", () => {
    expect(getStatusBadgeClass("shipped")).toContain("bg-accent");
    expect(getStatusBadgeClass("shipped")).toContain("text-accent");
  });

  it("returns emerald classes for delivered", () => {
    expect(getStatusBadgeClass("delivered")).toContain("bg-emerald");
    expect(getStatusBadgeClass("delivered")).toContain("text-emerald");
  });

  it("returns destructive classes for cancelled", () => {
    expect(getStatusBadgeClass("cancelled")).toContain("bg-destructive");
    expect(getStatusBadgeClass("cancelled")).toContain("text-destructive");
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
