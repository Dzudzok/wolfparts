import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const BASE = "https://www.mroauto.cz";
const UA = "Mozilla/5.0 (compatible; AutoDily/1.0)";

// ── Disk + memory cache ────────────────────────────────────────
// Memory cache for current process, disk cache persists across restarts

const memCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DISK_CACHE_DIR = path.join(process.cwd(), "data", "cache");

// Ensure cache dir exists
try { fs.mkdirSync(DISK_CACHE_DIR, { recursive: true }); } catch {}

function cacheKey(key: string): string {
  // Simple hash for filename
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // 1. Memory cache
  const mem = memCache.get(key);
  if (mem && Date.now() - mem.ts < CACHE_TTL) return Promise.resolve(mem.data as T);

  // 2. Disk cache
  const diskPath = path.join(DISK_CACHE_DIR, cacheKey(key) + ".json");
  try {
    const stat = fs.statSync(diskPath);
    if (Date.now() - stat.mtimeMs < CACHE_TTL) {
      const data = JSON.parse(fs.readFileSync(diskPath, "utf-8")) as T;
      memCache.set(key, { data, ts: Date.now() });
      return Promise.resolve(data);
    }
  } catch {}

  // 3. Fetch and save to both caches
  return fn().then((data) => {
    memCache.set(key, { data, ts: Date.now() });
    try { fs.writeFileSync(diskPath, JSON.stringify(data)); } catch {}
    return data;
  });
}

async function fetchHTML(url: string): Promise<cheerio.CheerioAPI> {
  const fullUrl = url.startsWith("/") ? BASE + url : url;
  const { data } = await axios.get(fullUrl, {
    headers: { "User-Agent": UA },
    timeout: 15000,
  });
  return cheerio.load(data);
}

// ── Categories for a given engine ──────────────────────────────

export interface Category {
  nodeId: string;
  name: string;
  isEndNode: boolean;
  href: string;
}

export async function getCategories(enginePageUrl: string, categoryId?: string): Promise<Category[]> {
  const url = categoryId
    ? `${enginePageUrl}?category-id=${categoryId}`
    : enginePageUrl;

  return cached(`cats:${url}`, async () => {
    const $ = await fetchHTML(url);
    const cats: Category[] = [];

    $("a[data-node-id]").each((_, el) => {
      const a = $(el);
      const href = a.attr("href") || "";
      if (href.startsWith("javascript:") || !href.startsWith("/")) return;

      cats.push({
        nodeId: a.attr("data-node-id") || "",
        name: a.find("span.name").text().trim(),
        isEndNode: a.attr("data-is-end-node") === "true",
        href,
      });
    });

    return cats;
  });
}

// ── Products from a leaf category page ─────────────────────────

export interface TecDocProduct {
  code: string;
  brand: string;
  name: string;
  genArtID: number | null;
}

export async function getLeafProducts(leafHref: string): Promise<TecDocProduct[]> {
  return cached(`prods:${leafHref}`, async () => {
    const $ = await fetchHTML(leafHref);
    const products: TecDocProduct[] = [];
    const seen = new Set<string>();

    // Each product is in a div[data-flex-tecdoc-generic-article-id]
    // Inside: a[0] is image link (empty text), a[1] has "BRAND CODE Description"
    // e.g. "MANN-FILTER W712/95 Olejový filtr Ölfilter"
    $("div[data-flex-tecdoc-generic-article-id]").each((_, el) => {
      const div = $(el);
      const genArtID = parseInt(div.attr("data-flex-tecdoc-generic-article-id") || "0") || null;

      // Find first <a> with non-empty text
      let text = "";
      div.find("a").each((_, linkEl) => {
        if (text) return;
        const t = $(linkEl).text().trim().replace(/\s+/g, " ");
        if (t.length >= 5) text = t;
      });
      if (!text) return;

      // Pattern: "BRAND CODE Description"
      // Examples:
      //   "TRW GDB1956 Sada brzdových..."         → brand=TRW, code=GDB1956
      //   "MANN-FILTER W712/95 Olejový filtr"      → brand=MANN-FILTER, code=W712/95
      //   "DAVID VASCO V442 Olejový filtr"         → brand=DAVID VASCO, code=V442
      //   "BLUE PRINT ADB112115 Olejový filtr"     → brand=BLUE PRINT, code=ADB112115
      //   "MASTER-SPORT GERMANY 722X-OF..."        → brand=MASTER-SPORT GERMANY, code=722X-OF...
      //
      // Key insight: brand words are all-letter (+ hyphens), code contains digits
      const words = text.split(/\s+/);
      let brandParts: string[] = [];
      let code = "";
      let nameStart = 0;

      for (let wi = 0; wi < words.length; wi++) {
        const w = words[wi];
        // Brand word: uppercase letters/hyphens only (no digits)
        if (/^[A-ZÀ-ŽÜÖÄß-]+$/.test(w) && !code) {
          brandParts.push(w);
        } else if (!code && brandParts.length > 0 && /\d/.test(w)) {
          // First word with digits after brand = product code
          code = w;
          nameStart = wi + 1;
          break;
        } else if (!code && brandParts.length > 0) {
          // All-letter word after brand that has no digits — skip it (e.g. "Germany")
          brandParts.push(w);
        } else {
          break;
        }
      }

      const brand = brandParts.join(" ");
      const name = words.slice(nameStart).join(" ");

      const key = `${brand}:${code}`;
      if (code.length >= 2 && !seen.has(key)) {
        seen.add(key);
        products.push({ code, brand, name, genArtID });
      }
    });

    return products;
  });
}

// ── Build engine page URL from our tecdoc data ────────────────

export function buildEnginePageUrl(
  brandSlug: string,
  modelSlug: string,
  engineSlug: string,
  brandId: number,
  modelId: number,
  engineId: number
): string {
  return `/cs/katalog/tecdoc/osobni/${brandSlug}/${modelSlug}/${engineSlug}/${brandId}/${modelId}/${engineId}`;
}
