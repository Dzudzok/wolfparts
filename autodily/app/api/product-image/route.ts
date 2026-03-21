import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Cache: productId → scraped data
const cache = new Map<string, { data: ScrapedData; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface ScrapedData {
  imageUrl: string | null;
  images: string[];
  attributes: Array<{ key: string; value: string }>;
  vehicles: string;
  description: string;
}

/**
 * GET /api/product-image?id=263631
 * Returns images + TecDoc attributes from mroauto.cz product page
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ imageUrl: null, images: [], attributes: [] });

  // Check cache
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, max-age=86400" } });
  }

  try {
    const { data: html } = await axios.get(
      `https://www.mroauto.cz/cs/hledani/1/9/x/x/x/x/${id}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept-Language": "cs" },
        timeout: 12000,
      }
    );

    // Images — TecAlliance CDN
    const allMatches = html.match(
      /https:\/\/digital-assets\.tecalliance\.services\/images\/\d+\/[a-f0-9]+\.jpg/g
    );
    const images: string[] = allMatches ? [...new Set<string>(allMatches)] : [];
    const imageUrl: string | null = images[0] || null;

    // TecDoc attributes — from <table> inside .flex-attributes
    const attributes: Array<{ key: string; value: string }> = [];
    const attrBlock = html.match(/class="flex-attributes"[\s\S]*?<table>([\s\S]*?)<\/table>/);
    if (attrBlock) {
      const rows = attrBlock[1].match(/<tr>([\s\S]*?)<\/tr>/g) || [];
      for (const row of rows) {
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
        if (cells.length >= 2) {
          const key = cells[0].replace(/<[^>]*>/g, "").trim();
          const value = cells[1].replace(/<[^>]*>/g, "").trim();
          if (key && value) attributes.push({ key, value });
        }
      }
    }

    // Vehicle compatibility — from description/title
    const descMatch = html.match(/"description"\s*:\s*"([^"]+)"/);
    const description = descMatch ? descMatch[1].replace(/\\u[\da-fA-F]{4}/g, "").trim() : "";

    // Vehicle list from page content
    const vehiclesMatch = html.match(/je vhodný pro modely aut[\s\S]*?<\/div>/);
    const vehicles = vehiclesMatch ? vehiclesMatch[0].replace(/<[^>]*>/g, "").replace("je vhodný pro modely aut", "").trim() : "";

    const result: ScrapedData = { imageUrl, images, attributes, vehicles, description };

    // Cache
    cache.set(id, { data: result, ts: Date.now() });
    if (cache.size > 50000) {
      const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 10000; i++) cache.delete(entries[i][0]);
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ imageUrl: null, images: [], attributes: [], vehicles: "", description: "" });
  }
}
