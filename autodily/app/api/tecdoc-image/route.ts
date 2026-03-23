import { NextRequest, NextResponse } from "next/server";
import { getTecDocApiKey } from "@/lib/tecdoc-key";

const PROVIDER = 415;

/** Server-side in-memory image cache — shared across all users */
const memCache = new Map<string, { buffer: ArrayBuffer; contentType: string; ts: number }>();
const MAX_CACHE = 2000;
const CAR_TTL = 7 * 24 * 3600 * 1000;   // 7 days
const DOC_TTL = 24 * 3600 * 1000;        // 1 day

/**
 * GET /api/tecdoc-image?type=car&id=3726
 * GET /api/tecdoc-image?type=doc&id=845520172495142
 *
 * Proxies images from TecAlliance Pegasus with auto-rotating API key.
 * Car images are cached in server memory so subsequent users get them instantly.
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  const cacheKey = `${type}:${id}`;
  const ttl = type === "car" ? CAR_TTL : DOC_TTL;
  const cacheTtlSec = type === "car" ? 604800 : 86400;

  // Serve from memory cache if fresh
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < ttl) {
    return new NextResponse(cached.buffer, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": `public, max-age=${cacheTtlSec}, stale-while-revalidate=86400`,
      },
    });
  }

  const apiKey = await getTecDocApiKey();
  const docId = type === "car" ? `DR${id}` : id;
  const url = `https://webservice.tecalliance.services/pegasus-3-0/documents/${PROVIDER}/${docId}/0?api_key=${apiKey}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    // Store in memory cache (evict oldest if full)
    if (memCache.size >= MAX_CACHE) {
      const oldest = memCache.keys().next().value;
      if (oldest) memCache.delete(oldest);
    }
    memCache.set(cacheKey, { buffer, contentType, ts: Date.now() });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${cacheTtlSec}, stale-while-revalidate=86400`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
