import { NextRequest, NextResponse } from "next/server";
import { getTecDocApiKey } from "@/lib/tecdoc-key";
import { getTypesenseAdminClient, carThumbnailsSchema } from "@/lib/typesense";

const PROVIDER = 415;

/** Server-side in-memory cache for doc images (not persisted) */
const memCache = new Map<string, { buffer: ArrayBuffer; contentType: string; ts: number }>();
const MAX_CACHE = 2000;
const DOC_TTL = 24 * 3600 * 1000; // 1 day

let tsCollectionReady = false;

async function ensureCarThumbnailsCollection() {
  if (tsCollectionReady) return;
  const client = getTypesenseAdminClient();
  try {
    await client.collections("car_thumbnails").retrieve();
  } catch {
    await client.collections().create(carThumbnailsSchema);
  }
  tsCollectionReady = true;
}

/**
 * GET /api/tecdoc-image?type=car&id=3726
 * GET /api/tecdoc-image?type=doc&id=845520172495142
 *
 * Car images: persisted in Typesense (permanent cache for all users).
 * Doc images: in-memory cache only (1 day TTL).
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  // ─── CAR IMAGES: persistent Typesense cache ───
  if (type === "car") {
    try {
      await ensureCarThumbnailsCollection();
      const client = getTypesenseAdminClient();

      // Check Typesense first
      try {
        const doc = await client.collections("car_thumbnails").documents(id).retrieve() as { image_b64: string; content_type: string };
        const buffer = Buffer.from(doc.image_b64, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": doc.content_type,
            "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400", // 30 days
          },
        });
      } catch {
        // Not in Typesense yet — fetch from TecDoc
      }

      const apiKey = await getTecDocApiKey();
      const url = `https://webservice.tecalliance.services/pegasus-3-0/documents/${PROVIDER}/DR${id}/0?api_key=${apiKey}`;
      const res = await fetch(url);

      if (!res.ok) {
        return new NextResponse(null, { status: 404 });
      }

      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const b64 = Buffer.from(buffer).toString("base64");

      // Save to Typesense (fire and forget)
      client.collections("car_thumbnails").documents().upsert({
        id,
        image_b64: b64,
        content_type: contentType,
        created_at: Math.floor(Date.now() / 1000),
      }).catch(() => {});

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400",
        },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  // ─── DOC IMAGES: in-memory cache only ───
  const cacheKey = `doc:${id}`;
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < DOC_TTL) {
    return new NextResponse(cached.buffer, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const apiKey = await getTecDocApiKey();
    const url = `https://webservice.tecalliance.services/pegasus-3-0/documents/${PROVIDER}/${id}/0?api_key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    if (memCache.size >= MAX_CACHE) {
      const oldest = memCache.keys().next().value;
      if (oldest) memCache.delete(oldest);
    }
    memCache.set(cacheKey, { buffer, contentType, ts: Date.now() });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
