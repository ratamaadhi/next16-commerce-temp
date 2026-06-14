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
  pending: "bg-muted text-muted-foreground border-border",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
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
