import { NextRequest, NextResponse } from "next/server";

// UX-level guard only: block unauthenticated access to the internal dashboard
// early. The real authorization (staff role) is enforced server-side in the
// dashboard layout and the /api/analytics/* route handlers.
export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
