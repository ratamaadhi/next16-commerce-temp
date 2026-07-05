import { StrapiError } from "./strapi";

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337";

// Roles allowed into the internal analytics dashboard. Source of truth is the
// Strapi user role (no FE-local role system). Configurable via env so backend
// can name the staff role freely (gap: role must exist in Strapi).
const STAFF_ROLES = (
  process.env.ANALYTICS_STAFF_ROLES ?? "admin,analytics-admin,staff"
)
  .split(",")
  .map((r) => r.trim().toLowerCase())
  .filter(Boolean);

export interface StrapiUserRole {
  id?: number;
  name?: string;
  type?: string;
}

export interface StrapiUser {
  id: number;
  documentId?: string;
  username?: string;
  email?: string;
  role?: StrapiUserRole | null;
}

export function isStaff(user: StrapiUser | null | undefined): boolean {
  const role = user?.role;
  if (!role) return false;
  const name = (role.name ?? role.type ?? "").toLowerCase();
  return STAFF_ROLES.includes(name);
}

/** Fetch the authenticated user with role populated, for the staff guard. */
export async function getStaffUser(
  token: string | undefined,
): Promise<StrapiUser | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as StrapiUser;
  } catch {
    return null;
  }
}

// ---- Analytics conversion contract (GET /api/analytics/conversion) ----
// Contract defined here and consumed by the dashboard. Backend (Strapi) must
// implement the aggregation to match this shape (gap: not in OpenAPI spec).

export const FUNNEL_STEPS = [
  "session_start",
  "product_view",
  "add_to_cart",
  "checkout_start",
  "purchase",
] as const;

export type FunnelStepName = (typeof FUNNEL_STEPS)[number];

export interface FunnelStep {
  step: FunnelStepName;
  count: number;
}

export interface DailyRow {
  date: string; // YYYY-MM-DD
  sessions: number;
  purchases: number;
  conversionRate: number; // purchases / sessions, 0..1
  session_start: number;
  product_view: number;
  add_to_cart: number;
  checkout_start: number;
  purchase: number;
}

export interface ConversionSummary {
  sessions: number;
  purchases: number;
  conversionRate: number; // 0..1
}

export interface ConversionFilters {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export interface ConversionResponse {
  range: { from: string; to: string };
  filters: ConversionFilters;
  summary: ConversionSummary;
  funnel: FunnelStep[];
  daily: DailyRow[];
}

export interface ConversionQuery {
  from: string;
  to: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Default range: last 30 days (inclusive of today). */
export function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toISODate(from), to: toISODate(to) };
}

/**
 * Parse/validate query params for the conversion endpoint. Falls back to the
 * last-30-days default when from/to are missing or malformed.
 */
export function parseConversionQuery(
  params: URLSearchParams | Record<string, string | undefined>,
): ConversionQuery {
  const get = (k: string) =>
    params instanceof URLSearchParams
      ? params.get(k) ?? undefined
      : params[k];

  const fallback = defaultRange();
  const rawFrom = get("from");
  const rawTo = get("to");
  const from = rawFrom && DATE_RE.test(rawFrom) ? rawFrom : fallback.from;
  const to = rawTo && DATE_RE.test(rawTo) ? rawTo : fallback.to;

  const clean = (v: string | undefined) => {
    const t = v?.trim();
    return t ? t : undefined;
  };

  return {
    // keep chronological order even if caller swaps them
    from: from <= to ? from : to,
    to: from <= to ? to : from,
    utm_source: clean(get("utm_source")),
    utm_medium: clean(get("utm_medium")),
    utm_campaign: clean(get("utm_campaign")),
  };
}

// Shape actually returned by Strapi's endpoint. Mapped into ConversionResponse
// (the dashboard contract) so UI components stay decoupled from backend naming.
interface RawTotals {
  sessions: number;
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  purchases: number;
  purchasingSessions?: number;
  conversionRate: number;
}

interface RawDay {
  date: string;
  sessions: number;
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  purchases: number;
  conversionRate: number;
}

interface RawConversion {
  data?: {
    range?: { from: string; to: string };
    totals?: RawTotals;
    days?: RawDay[];
  };
}

function mapConversion(
  raw: RawConversion,
  query: ConversionQuery,
): ConversionResponse {
  const d = raw?.data;
  const t = d?.totals;
  if (!t || !Array.isArray(d?.days)) {
    throw new StrapiError("Unexpected analytics response shape", 502, raw);
  }

  return {
    range: d?.range ?? { from: query.from, to: query.to },
    filters: {
      utm_source: query.utm_source ?? null,
      utm_medium: query.utm_medium ?? null,
      utm_campaign: query.utm_campaign ?? null,
    },
    summary: {
      sessions: t.sessions,
      purchases: t.purchases,
      conversionRate: t.conversionRate,
    },
    funnel: [
      { step: "session_start", count: t.sessions },
      { step: "product_view", count: t.productViews },
      { step: "add_to_cart", count: t.addToCarts },
      { step: "checkout_start", count: t.checkoutStarts },
      { step: "purchase", count: t.purchases },
    ],
    daily: d.days.map((day) => ({
      date: day.date,
      sessions: day.sessions,
      purchases: day.purchases,
      conversionRate: day.conversionRate,
      session_start: day.sessions,
      product_view: day.productViews,
      add_to_cart: day.addToCarts,
      checkout_start: day.checkoutStarts,
      purchase: day.purchases,
    })),
  };
}

/** Fetch pre-aggregated conversion analytics from Strapi and map to contract. */
export async function getConversion(
  query: ConversionQuery,
  token: string,
): Promise<ConversionResponse> {
  const search = new URLSearchParams();
  search.set("from", query.from);
  search.set("to", query.to);
  if (query.utm_source) search.set("utm_source", query.utm_source);
  if (query.utm_medium) search.set("utm_medium", query.utm_medium);
  if (query.utm_campaign) search.set("utm_campaign", query.utm_campaign);

  const res = await fetch(
    `${STRAPI_URL}/api/analytics/conversion?${search.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new StrapiError(
      body?.error?.message || `Analytics request failed (${res.status})`,
      res.status,
      body,
    );
  }

  return mapConversion((await res.json()) as RawConversion, query);
}

export { StrapiError };
