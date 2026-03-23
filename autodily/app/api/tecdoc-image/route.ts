import { NextRequest, NextResponse } from "next/server";
import { getCarPhotoUrl, getDocumentUrl } from "@/lib/tecdoc-media";

/**
 * GET /api/tecdoc-image?type=car&id=3726
 * GET /api/tecdoc-image?type=doc&id=845520172495142
 *
 * Proxies images from TecAlliance Pegasus so API key is not exposed client-side.
 * Caches via CDN headers (7 days for cars, 1 day for docs).
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  const url = type === "car" ? getCarPhotoUrl(id) : getDocumentUrl(id);
  const cacheTtl = type === "car" ? 604800 : 86400; // 7 days / 1 day

  try {
    const res = await fetch(url, { next: { revalidate: cacheTtl } });

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
