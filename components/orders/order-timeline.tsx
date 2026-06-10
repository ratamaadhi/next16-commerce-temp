import { getTimelineSteps, ORDER_STATUS_TITLES } from "./constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OrderTimelineProps {
  orderStatus?: string;
  className?: string;
}

export function OrderTimeline({ orderStatus, className }: OrderTimelineProps) {
  const steps = getTimelineSteps(orderStatus);
  if (steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent =
    steps.length > 1
      ? Math.min(Math.round((completedCount / (steps.length - 1)) * 100), 100)
      : completedCount > 0
        ? 100
        : 0;

  return (
    <div className={cn("bg-card rounded-xl border p-6", className)}>
      <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-5">
        Status Pesanan
      </h3>
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-4 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-border" />
        {/* Progress fill */}
        <div
          className="absolute top-4 left-[calc(12.5%)] h-0.5 bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progressPercent * 0.75}%` }}
        />
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  step.completed && "border-primary bg-primary text-primary-foreground",
                  step.active && !step.completed && "border-primary bg-background text-primary",
                  !step.completed && !step.active && "border-border bg-card text-muted-foreground",
                )}
              >
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors duration-300",
                  step.completed || step.active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_TITLES[step.key] ?? step.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
