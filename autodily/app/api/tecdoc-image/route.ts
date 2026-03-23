import { NextRequest, NextResponse } from "next/server";
import { getTecDocApiKey } from "@/lib/tecdoc-key";

const PROVIDER = 415;

/**
 * GET /api/tecdoc-image?type=car&id=3726
 * GET /api/tecdoc-image?type=doc&id=845520172495142
 *
 * Proxies images from TecAlliance Pegasus with auto-rotating API key.
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  const apiKey = await getTecDocApiKey();
  const docId = type === "car" ? `DR${id}` : id;
  const url = `https://webservice.tecalliance.services/pegasus-3-0/documents/${PROVIDER}/${docId}/0?api_key=${apiKey}`;
  const cacheTtl = type === "car" ? 604800 : 86400;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${cacheTtl}, stale-while-revalidate=86400`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
