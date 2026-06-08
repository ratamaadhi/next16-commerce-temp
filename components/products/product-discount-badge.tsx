import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductDiscountBadgeProps {
  originalPrice: number;
  salePrice: number;
  className?: string;
}

function calcDiscount(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

export function ProductDiscountBadge({ originalPrice, salePrice, className }: ProductDiscountBadgeProps) {
  if (originalPrice <= salePrice) return null;

  const discount = calcDiscount(originalPrice, salePrice);

  return (
    <Badge
      variant="default"
      className={cn("text-xs font-bold", className)}
    >
      -{discount}%
    </Badge>
  );
}
