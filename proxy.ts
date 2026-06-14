import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const brandMap: Record<string, string> = {
  cyra: "cyra",
  lumina: "lumina",
  noir: "noir",
};

export function proxy(request: NextRequest) {
  // Allow ?brand=lumina for local dev testing
  const queryBrand = request.nextUrl.searchParams.get("brand");
  if (queryBrand && queryBrand in brandMap) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-brand-id", queryBrand);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  const brand = brandMap[subdomain] ?? "cyra";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-brand-id", brand);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
