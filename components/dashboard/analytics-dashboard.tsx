"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardFilters } from "./filters";
import { KpiCards } from "./kpi-cards";
import { FunnelChart } from "./funnel-chart";
import { DailyChart } from "./daily-chart";
import { DashboardEmpty, DashboardError, DashboardLoading } from "./states";
import {
  defaultRange,
  type ConversionQuery,
  type ConversionResponse,
} from "@/lib/analytics";

function buildSearch(q: ConversionQuery): string {
  const s = new URLSearchParams();
  s.set("from", q.from);
  s.set("to", q.to);
  if (q.utm_source) s.set("utm_source", q.utm_source);
  if (q.utm_medium) s.set("utm_medium", q.utm_medium);
  if (q.utm_campaign) s.set("utm_campaign", q.utm_campaign);
  return s.toString();
}

function isConversionResponse(v: unknown): v is ConversionResponse {
  if (!v || typeof v !== "object") return false;
  const d = v as Partial<ConversionResponse>;
  return (
    typeof d.summary === "object" &&
    d.summary !== null &&
    typeof d.summary.sessions === "number" &&
    Array.isArray(d.funnel) &&
    Array.isArray(d.daily)
  );
}

async function fetchConversion(q: ConversionQuery): Promise<ConversionResponse> {
  const res = await fetch(`/api/analytics/conversion?${buildSearch(q)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request gagal (${res.status})`);
  }
  const data = await res.json().catch(() => null);
  if (!isConversionResponse(data)) {
    throw new Error("Format respons analytics tidak sesuai kontrak");
  }
  return data;
}

function isEmpty(data: ConversionResponse): boolean {
  return (
    data.summary.sessions === 0 &&
    data.daily.every((d) => d.sessions === 0 && d.purchases === 0)
  );
}

export function AnalyticsDashboard() {
  const initial = useMemo<ConversionQuery>(() => ({ ...defaultRange() }), []);
  const [draft, setDraft] = useState<ConversionQuery>(initial);
  const [applied, setApplied] = useState<ConversionQuery>(initial);

  const query = useQuery({
    queryKey: ["analytics-conversion", applied],
    queryFn: () => fetchConversion(applied),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Conversion Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {applied.from} — {applied.to}
        </p>
      </div>

      <DashboardFilters value={draft} onChange={setDraft} />

      <div className="flex items-center gap-2">
        <Button onClick={() => setApplied(draft)} disabled={!dirty}>
          Terapkan filter
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => query.refetch()}
          aria-label="Muat ulang"
          disabled={query.isFetching}
        >
          <RefreshCw
            className={query.isFetching ? "size-4 animate-spin" : "size-4"}
          />
        </Button>
        {query.isFetching && !query.isPending && (
          <span className="text-xs text-muted-foreground">Memuat…</span>
        )}
      </div>

      {query.isPending ? (
        <DashboardLoading />
      ) : query.isError ? (
        <DashboardError
          message={(query.error as Error)?.message}
          onRetry={() => query.refetch()}
        />
      ) : query.data && isEmpty(query.data) ? (
        <DashboardEmpty />
      ) : query.data ? (
        <div className="space-y-6">
          <KpiCards summary={query.data.summary} />
          <FunnelChart funnel={query.data.funnel} />
          <DailyChart daily={query.data.daily} />
        </div>
      ) : null}
    </div>
  );
}
