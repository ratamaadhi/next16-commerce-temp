"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DailyRow } from "@/lib/analytics";

const chartConfig = {
  sessions: { label: "Sessions", color: "var(--chart-1)" },
  purchases: { label: "Purchases", color: "var(--chart-2)" },
} satisfies ChartConfig;

const numberFmt = new Intl.NumberFormat("id-ID");

function shortDate(d: string): string {
  // d = YYYY-MM-DD; show DD/MM
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function DailyChart({ daily }: { daily: DailyRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Breakdown</CardTitle>
        <CardDescription>Sessions vs purchases per hari</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart accessibilityLayer data={daily} margin={{ left: 4, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={shortDate}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="sessions"
              type="monotone"
              stroke="var(--color-sessions)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="purchases"
              type="monotone"
              stroke="var(--color-purchases)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Product View</TableHead>
                <TableHead className="text-right">Add to Cart</TableHead>
                <TableHead className="text-right">Checkout</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFmt.format(row.sessions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFmt.format(row.product_view)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFmt.format(row.add_to_cart)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFmt.format(row.checkout_start)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFmt.format(row.purchases)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(row.conversionRate * 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
