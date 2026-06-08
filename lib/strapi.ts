import qs from "qs";

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: object;
}

export class StrapiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "StrapiError";
  }
}

export async function strapiFetch<T>(
  path: string,
  urlParams: Record<string, unknown> = {},
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const queryString = qs.stringify(urlParams, {
    encodeValuesOnly: true,
    addQueryPrefix: true,
  });

  const url = `${STRAPI_URL}/api${path}${queryString}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new StrapiError(`Strapi API error: ${response.statusText}`, response.status, errorData);
    }

    return response.json();
  } catch (error) {
    if (error instanceof StrapiError) throw error;
    throw new StrapiError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export function getStrapiMedia(url: string): string {
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}

export function formatPrice(price: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}
