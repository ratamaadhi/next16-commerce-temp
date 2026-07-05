import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getConversion,
  getStaffUser,
  isStaff,
  parseConversionQuery,
  StrapiError,
} from "@/lib/analytics";

// BFF for the internal dashboard. Enforces the staff guard server-side (FE
// guard is UX only), validates the query, and proxies to Strapi's aggregated
// analytics endpoint.
export async function GET(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getStaffUser(token);
  if (!isStaff(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = parseConversionQuery(req.nextUrl.searchParams);

  try {
    const data = await getConversion(query, token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof StrapiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status || 502 },
      );
    }
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 502 },
    );
  }
}
