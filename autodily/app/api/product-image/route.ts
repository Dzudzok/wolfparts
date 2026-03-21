import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Cache: productId → image URL (or "none")
const imageCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_NEGATIVE_TTL = 6 * 60 * 60 * 1000;

/**
 * GET /api/product-image?id=263631
 * Fetches product page from mroauto.cz and extracts TecAlliance image URL
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ imageUrl: null });

  // Check cache
  const cached = imageCache.get(id);
  if (cached) {
    const ttl = cached.url === "none" ? CACHE_NEGATIVE_TTL : CACHE_TTL;
    if (Date.now() - cached.ts < ttl) {
      return NextResponse.json(
        { imageUrl: cached.url === "none" ? null : cached.url },
        { headers: { "Cache-Control": "public, max-age=86400" } }
      );
    }
  }

  try {
    const { data: html } = await axios.get(
      `https://www.mroauto.cz/cs/hledani/1/9/x/x/x/x/${id}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "cs",
        },
        timeout: 10000,
      }
    );

    // Find ALL unique TecAlliance images
    const allMatches = html.match(
      /https:\/\/digital-assets\.tecalliance\.services\/images\/\d+\/[a-f0-9]+\.jpg/g
    );
    const uniqueImages: string[] = allMatches ? [...new Set<string>(allMatches)] : [];

    const imageUrl: string | null = uniqueImages[0] || null;
    imageCache.set(id, { url: imageUrl || "none", ts: Date.now() });

    // Evict old entries if cache too large
    if (imageCache.size > 50000) {
      const entries = [...imageCache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 10000; i++) imageCache.delete(entries[i][0]);
    }

    return NextResponse.json(
      { imageUrl, images: uniqueImages },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch {
    imageCache.set(id, { url: "none", ts: Date.now() });
    return NextResponse.json({ imageUrl: null, images: [] });
  }
}
