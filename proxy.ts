import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const brandMap: Record<string, string> = {
  cyra: "cyra",
  lumina: "lumina",
  noir: "noir",
};

export function proxy(request: NextRequest) {
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
