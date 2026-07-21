import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderDocumentId: string }> },
) {
  const { orderDocumentId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incoming = await req.formData();
  const file = incoming.get("files");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "File bukti pembayaran wajib diisi" },
      { status: 400 },
    );
  }

  const senderName = incoming.get("senderName");
  if (typeof senderName !== "string" || senderName.trim() === "") {
    return NextResponse.json(
      { error: "Nama pengirim wajib diisi" },
      { status: 400 },
    );
  }

  const forward = new FormData();
  forward.append("files", file);
  forward.append(
    "data",
    JSON.stringify({
      senderName: senderName.trim(),
      proofStatus: "pending",
    }),
  );

  const res = await fetch(
    `${STRAPI_URL}/api/manual-payments/${encodeURIComponent(orderDocumentId)}/proofs`,
    {
      method: "POST",
      // NOTE: no Content-Type header — fetch sets the multipart boundary.
      headers: { Authorization: `Bearer ${token}` },
      body: forward,
    },
  );

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
