import { NextRequest, NextResponse } from "next/server";
import { getArticleByCode } from "@/lib/tecdoc-api";
import { getTypesenseAdminClient } from "@/lib/typesense";

// In-memory cache
const cache = new Map<string, { data: ResponseData; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface ResponseData {
  imageUrl: string | null;
  images: string[];
  attributes: Array<{ key: string; value: string }>;
  pdfs: Array<{ url: string; name: string }>;
  genericArticle: string;
  category: string;
  vehicles: string;
}

/**
 * GET /api/product-image?id=263631
 * Fetches product images + TecDoc specs directly from TecAlliance API
 * No scraping needed!
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const codeParam = req.nextUrl.searchParams.get("code");

  // Direct code lookup (no Typesense needed)
  if (codeParam && !id) {
    const cacheKey = "code:" + codeParam;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, max-age=86400" } });
    }
    try {
      const article = await getArticleByCode(codeParam);
      const images = (article?.images || []).sort((a, b) => a.sortNumber - b.sortNumber).map((img) => img.imageURL800 || img.imageURL400);
      const imageUrl = images[0] || null;
      const result: ResponseData = { imageUrl, images, attributes: [], pdfs: [], genericArticle: "", category: "", vehicles: "" };
      cache.set(cacheKey, { data: result, ts: Date.now() });
      return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=86400" } });
    } catch {
      return NextResponse.json({ imageUrl: null, images: [], attributes: [], pdfs: [], genericArticle: "", category: "", vehicles: "" });
    }
  }

  if (!id) return NextResponse.json({ imageUrl: null, images: [], attributes: [] });

  // Check memory cache
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, max-age=86400" } });
  }

  // Get product code + brand from Typesense
  let code = "";
  let brand = "";
  try {
    const client = getTypesenseAdminClient();
    const doc = await client.collections("products").documents(id).retrieve() as Record<string, unknown>;
    code = (doc.product_code as string) || "";
    brand = (doc.brand as string) || "";
  } catch {
    return NextResponse.json({ imageUrl: null, images: [], attributes: [], pdfs: [], genericArticle: "", category: "", vehicles: "" });
  }

  if (!code) {
    return NextResponse.json({ imageUrl: null, images: [], attributes: [], pdfs: [], genericArticle: "", category: "", vehicles: "" });
  }

  try {
    // Call TecDoc API — search by code, then filter by brand to get correct article
    const article = await getArticleByCode(code, brand);

    if (!article) {
      const empty: ResponseData = { imageUrl: null, images: [], attributes: [], pdfs: [], genericArticle: "", category: "", vehicles: "" };
      cache.set(id, { data: empty, ts: Date.now() });
      return NextResponse.json(empty, { headers: { "Cache-Control": "public, max-age=86400" } });
    }

    // Images — use 800px for detail, CDN URLs are public
    const images = (article.images || [])
      .sort((a, b) => a.sortNumber - b.sortNumber)
      .map((img) => img.imageURL800 || img.imageURL400);
    const imageUrl = images[0] || null;

    // TecDoc specs
    const attributes = (article.articleCriteria || []).map((c) => ({
      key: c.criteriaDescription,
      value: c.formattedValue + (c.criteriaUnitDescription ? ` ${c.criteriaUnitDescription}` : ""),
    }));

    // PDFs
    const pdfs = (article.pdfs || []).map((p) => ({
      url: p.url,
      name: p.headerDescription || p.fileName,
    }));

    // Generic article info
    const ga = article.genericArticles?.[0];
    const genericArticle = ga?.genericArticleDescription || "";
    const category = ga?.assemblyGroupName || "";

    // Vehicle compatibility scraping removed — was adding up to 8s per request
    const vehicles = "";

    const result: ResponseData = { imageUrl, images, attributes, pdfs, genericArticle, category, vehicles };

    // Persist main image to Typesense for faster loading on list pages
    if (imageUrl) {
      try {
        const client = getTypesenseAdminClient();
        await client.collections("products").documents(id).update({ image_url: imageUrl });
      } catch { /* non-critical */ }
    }

    cache.set(id, { data: result, ts: Date.now() });
    if (cache.size > 50000) {
      const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 10000; i++) cache.delete(entries[i][0]);
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ imageUrl: null, images: [], attributes: [], pdfs: [], genericArticle: "", category: "", vehicles: "" });
  }
}
