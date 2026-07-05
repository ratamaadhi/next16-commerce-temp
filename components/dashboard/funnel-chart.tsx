"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { FunnelStep } from "@/lib/analytics";

const STEP_LABELS: Record<string, string> = {
  session_start: "Session Start",
  product_view: "Product View",
  add_to_cart: "Add to Cart",
  checkout_start: "Checkout Start",
  purchase: "Purchase",
};

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig = {
  count: { label: "Events" },
} satisfies ChartConfig;

export function FunnelChart({ funnel }: { funnel: FunnelStep[] }) {
  const top = funnel[0]?.count ?? 0;
  const data = funnel.map((f, i) => ({
    step: f.step,
    label: STEP_LABELS[f.step] ?? f.step,
    count: f.count,
    pct: top > 0 ? (f.count / top) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Event</CardTitle>
        <CardDescription>
          Jumlah event per tahap (% dari session start)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 12, right: 48 }}
          >
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 12 }}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const pct = item?.payload?.pct ?? 0;
                    return `${Number(value).toLocaleString("id-ID")} (${pct.toFixed(1)}%)`;
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={4}>
              {data.map((d) => (
                <Cell key={d.step} fill={d.color} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                className="fill-foreground"
                fontSize={12}
                formatter={(v: unknown) => Number(v).toLocaleString("id-ID")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
