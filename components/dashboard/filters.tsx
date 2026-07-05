"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ConversionQuery } from "@/lib/analytics";

// Nilai UTM yang teramati ada di data, dipakai sebagai saran autocomplete.
// CATATAN: statis (snapshot observasi), bukan sinkron dengan data live. Input
// tetap free-text. Sumber kebenaran seharusnya endpoint distinct-values backend
// (belum ada) — daftar campaign belum tentu exhaustive.
const UTM_SUGGESTIONS = {
  source: ["google", "facebook", "instagram", "tiktok", "newsletter", "direct"],
  medium: ["cpc", "email", "social", "organic"],
  campaign: ["flash_sale", "payday", "retargeting"],
} as const;

const PRESETS = [
  { label: "7 hari", days: 7 },
  { label: "30 hari", days: 30 },
  { label: "90 hari", days: 90 },
];

function isoDaysAgo(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function DashboardFilters({
  value,
  onChange,
}: {
  value: ConversionQuery;
  onChange: (next: ConversionQuery) => void;
}) {
  const set = (patch: Partial<ConversionQuery>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="from">Dari</Label>
          <Input
            id="from"
            type="date"
            value={value.from}
            max={value.to}
            onChange={(e) => set({ from: e.target.value })}
            className="w-40"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to">Sampai</Label>
          <Input
            id="to"
            type="date"
            value={value.to}
            min={value.from}
            onChange={(e) => set({ to: e.target.value })}
            className="w-40"
          />
        </div>
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set(isoDaysAgo(p.days))}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="utm_source">UTM Source</Label>
          <Input
            id="utm_source"
            list="utm-source-options"
            placeholder="mis. google"
            value={value.utm_source ?? ""}
            onChange={(e) => set({ utm_source: e.target.value || undefined })}
          />
          <datalist id="utm-source-options">
            {UTM_SUGGESTIONS.source.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="utm_medium">UTM Medium</Label>
          <Input
            id="utm_medium"
            list="utm-medium-options"
            placeholder="mis. social"
            value={value.utm_medium ?? ""}
            onChange={(e) => set({ utm_medium: e.target.value || undefined })}
          />
          <datalist id="utm-medium-options">
            {UTM_SUGGESTIONS.medium.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="utm_campaign">UTM Campaign</Label>
          <Input
            id="utm_campaign"
            list="utm-campaign-options"
            placeholder="mis. flash_sale"
            value={value.utm_campaign ?? ""}
            onChange={(e) => set({ utm_campaign: e.target.value || undefined })}
          />
          <datalist id="utm-campaign-options">
            {UTM_SUGGESTIONS.campaign.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
