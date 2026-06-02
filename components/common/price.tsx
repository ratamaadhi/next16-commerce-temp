import { formatPrice } from "@/lib/strapi";

interface PriceProps {
  amount: number;
  className?: string;
  currency?: string;
}

export function Price({ amount, className, currency }: PriceProps) {
  return (
    <span className={className}>
      {formatPrice(amount, currency)}
    </span>
  );
}
