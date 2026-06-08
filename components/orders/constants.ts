export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TITLES: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? "bg-muted text-muted-foreground border-border";
}

interface TimelineStep {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
}

const TIMELINE_BASE_STEPS = ORDER_STATUSES
  .filter((s) => s !== "cancelled")
  .map((key) => ({ key, label: ORDER_STATUS_TITLES[key] }));

export function getTimelineSteps(currentStatus?: string): TimelineStep[] {
  if (currentStatus === "cancelled") return [];
  const currentIdx = TIMELINE_BASE_STEPS.findIndex((s) => s.key === currentStatus);
  return TIMELINE_BASE_STEPS.map((step, idx) => ({
    ...step,
    completed: idx < currentIdx || (currentStatus === "delivered" && idx === currentIdx),
    active: idx === currentIdx,
  }));
}
