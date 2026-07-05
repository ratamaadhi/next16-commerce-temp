import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import type { ConversionSummary } from "@/lib/analytics";

const numberFmt = new Intl.NumberFormat("id-ID");

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function KpiCards({ summary }: { summary: ConversionSummary }) {
  const items = [
    { label: "Sessions", value: numberFmt.format(summary.sessions) },
    { label: "Purchases", value: numberFmt.format(summary.purchases) },
    {
      label: "Conversion Rate",
      value: formatPercent(summary.conversionRate),
      hint: "session → purchase",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="gap-1">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{item.value}</CardTitle>
            {item.hint && (
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
