import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONDITION_LABELS: Record<string, string> = {
  like_new: "Like New",
  gently_used: "Gently Used",
  well_loved: "Well Loved",
};

interface ProductConditionBadgeProps {
  condition: "like_new" | "gently_used" | "well_loved";
  className?: string;
}

export function ProductConditionBadge({ condition, className }: ProductConditionBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-xs font-medium", className)}
    >
      {CONDITION_LABELS[condition] || condition}
    </Badge>
  );
}
