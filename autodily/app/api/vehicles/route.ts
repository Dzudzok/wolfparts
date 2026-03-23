import { NextRequest } from "next/server";
import {
  getManufacturers,
  getModelSeries,
  getVehicles,
  getCategoriesForVehicle,
  getBrandsForVehicleCategory,
} from "@/lib/tecdoc-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
import { findByCode, findByEngineId } from "@/lib/nextis-api";

// Cache: categoryId → { seed, genArt } — loaded from JSON + enriched at runtime
const seedCache = new Map<number, { seed: string; genArt: number }>();
let seedCacheLoaded = false;

function loadSeedCache() {
  if (seedCacheLoaded) return;
  seedCacheLoaded = true;
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "data", "category-seeds.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      for (const [id, val] of Object.entries(data)) {
        const v = val as { seed: string; genArt: number };
        seedCache.set(parseInt(id), { seed: v.seed, genArt: v.genArt });
      }
      console.log(`[vehicles] Loaded ${seedCache.size} category seeds from JSON`);
    }
  } catch {}
}

/**
 * GET /api/vehicles?action=brands|models|engines|categories|products
 * All data from TecDoc Pegasus API — zero scraping
 */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "brands";

  try {
    // ─── BRANDS ───────────────────────────────────────
    if (action === "brands") {
      const all = req.nextUrl.searchParams.get("all") === "1";
      const brands = await getManufacturers(all);
      return Response.json(
        brands.map((b) => ({
          name: b.manuName,
          brandId: b.manuId,
          slug: b.manuName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        }))
      );
    }

    // ─── MODELS ───────────────────────────────────────
    if (action === "models") {
      const brandId = parseInt(req.nextUrl.searchParams.get("brandId") || "0");
      if (!brandId) return Response.json([]);

      const models = await getModelSeries(brandId);
      return Response.json(
        models.map((m) => ({
          name: m.modelName || `Model ${m.modelId}`,
          modelId: m.modelId,
          slug: (m.modelName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          years: formatYears(m.yearOfConstFrom, m.yearOfConstTo),
        }))
      );
    }

    // ─── ENGINES ──────────────────────────────────────
    if (action === "engines") {
      const brandId = parseInt(req.nextUrl.searchParams.get("brandId") || "0");
      const modelId = parseInt(req.nextUrl.searchParams.get("modelId") || "0");
      if (!brandId || !modelId) return Response.json([]);

      const vehicles = await getVehicles(brandId, modelId);
      return Response.json(
        vehicles.map((v) => ({
          name: v.carName,
          engineId: v.carId,
          slug: v.carName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          power: v.powerKwFrom ? `${v.powerKwFrom} kW / ${v.powerHpFrom} HP` : "",
          years: formatYears(v.yearOfConstFrom, v.yearOfConstTo),
          engineCode: v.engineCodes || "",
          fuel: v.fuelType || "",
        }))
      );
    }

    // ─── CATEGORIES for vehicle ───────────────────────
    if (action === "categories") {
      const engineId = parseInt(req.nextUrl.searchParams.get("engineId") || "0");
      const parentId = parseInt(req.nextUrl.searchParams.get("parentId") || "0");
      if (!engineId) return Response.json([]);

      const allNodes = await getCategoriesForVehicle(engineId);

      // Filter to requested level
      const nodes = parentId === 0
        ? allNodes.filter((n) => !n.parentNodeId)
        : allNodes.filter((n) => n.parentNodeId === parentId);

      return Response.json(
        nodes
          .sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
          .map((n) => ({
            nodeId: String(n.assemblyGroupNodeId),
            name: n.assemblyGroupName,
            isEndNode: !n.hasChilds,
            href: "",
          }))
      );
    }

    // ─── PRODUCTS for vehicle + category ──────────────
    if (action === "products") {
      const engineId = parseInt(req.nextUrl.searchParams.get("engineId") || "0");
      const categoryId = parseInt(req.nextUrl.searchParams.get("categoryId") || "0");
      if (!engineId || !categoryId) return Response.json({ products: [], tecdocCount: 0 });

      loadSeedCache();

      // Get category name from TecDoc
      let categoryName = "";
      try {
        const allCats = await getCategoriesForVehicle(engineId);
        const catNode = allCats.find((c) => c.assemblyGroupNodeId === categoryId);
        categoryName = catNode?.assemblyGroupName || "";
      } catch {}

      interface NextisItem {
        responseItem: {
          id: number; valid: boolean; productCode: string; productBrand: string;
          productName: string; price: { unitPrice: number; unitPriceIncVAT: number; discount: number } | null;
          qtyAvailableMain: number;
        };
      }

      let items: NextisItem[] = [];
      let strategy = "";

      // === STRATEGY 1: Nextis findByEngineId ===
      // Gets ALL parts for this engine, then filter by category name
      try {
        const allParts = await findByEngineId(engineId);
        if (allParts.length > 0 && categoryName) {
          const catWords = categoryName.toLowerCase().split(/[\s/]+/).filter((w: string) => w.length > 2);
          items = allParts.filter((item: NextisItem) => {
            const name = (item.responseItem?.productName || "").toLowerCase();
            return catWords.some((w: string) => name.includes(w));
          });
          strategy = "engineId";
        }
      } catch {}

      // === STRATEGY 2: TecDoc brands + Nextis findByCode ===
      if (items.length === 0) {
        try {
          const tecdocBrands = await getBrandsForVehicleCategory(engineId, categoryId);
          const genericArticleId = tecdocBrands[0]?.genericArticleId || 0;
          if (genericArticleId) {
            const popularBrands = ["MANN-FILTER", "BOSCH", "FILTRON", "HENGST FILTER", "MAHLE", "TRW", "VALEO"];
            const brandsToTry = [
              ...popularBrands.filter((b) => tecdocBrands.some((tb) => tb.brandName === b)),
              ...tecdocBrands.map((b) => b.brandName).filter((b) => !popularBrands.includes(b)),
            ];

            const client = getTypesenseAdminClient();
            for (const brand of brandsToTry.slice(0, 8)) {
              try {
                const res = await client.collections("products").documents().search({
                  q: categoryName, query_by: "assortment,name", query_by_weights: "5,1",
                  filter_by: `brand:=${brand}`, per_page: 1,
                });
                const code = (res.hits?.[0]?.document as Record<string, unknown> | undefined)?.product_code as string;
                if (code) {
                  items = await findByCode(code, genericArticleId);
                  if (items.length > 0) {
                    strategy = "seedCode:" + code;
                    seedCache.set(categoryId, { seed: code, genArt: genericArticleId });
                    break;
                  }
                }
              } catch {}
            }
          }
        } catch {}
      }

      // === STRATEGY 3: Scrape mroauto.cz (your own site) → get Nextis product IDs ===
      if (items.length === 0) {
        try {
          const bs = req.nextUrl.searchParams.get("bs") || "";
          const ms = req.nextUrl.searchParams.get("ms") || "";
          const es = req.nextUrl.searchParams.get("es") || "";
          const bi = req.nextUrl.searchParams.get("bi") || "";
          const mi = req.nextUrl.searchParams.get("mi") || "";

          if (bs && ms && es) {
            const { default: axios } = await import("axios");
            const mroUrl = `https://www.mroauto.cz/cs/katalog/tecdoc/osobni/${bs}/${ms}/${es}/x/${bi}/${mi}/${engineId}/${categoryId}/`;
            const { data: html } = await axios.get(mroUrl, {
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              timeout: 12000,
            });

            // Extract Nextis product IDs from addToBasket() calls
            const re = /addToBasket\([^,]*,\s*'[^']*',\s*'([^']*)',\s*(\d+)/g;
            const nextisIds: number[] = [];
            let m;
            while ((m = re.exec(html)) !== null) {
              nextisIds.push(parseInt(m[2]));
            }

            if (nextisIds.length > 0) {
              strategy = "mroauto";
              const { checkItemsByID } = await import("@/lib/nextis-api");
              for (let i = 0; i < nextisIds.length; i += 50) {
                try {
                  const checked = await checkItemsByID(nextisIds.slice(i, i + 50));
                  for (const item of checked) {
                    const ri = item.responseItem || item;
                    if (ri?.productCode) items.push({ responseItem: ri } as NextisItem);
                  }
                } catch {}
              }
            }
          }
        } catch {}
      }

      // Deduplicate
      const seen = new Set<string>();
      const uniqueItems = items.filter((ni) => {
        const ri = ni.responseItem;
        if (!ri?.productCode) return false;
        const key = `${ri.productCode}|${ri.productBrand}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Batch Typesense lookup for IDs + images (optional enrichment)
      const client = getTypesenseAdminClient();
      const tsMap = new Map<string, Record<string, unknown>>();
      for (let i = 0; i < Math.min(uniqueItems.length, 60); i += 20) {
        const batch = uniqueItems.slice(i, i + 20);
        try {
          const searches = batch.map((ni) => ({
            collection: "products", q: ni.responseItem.productCode, query_by: "product_code", per_page: 1,
          }));
          const res = await client.multiSearch.perform({ searches }, {});
          for (const result of res.results || []) {
            const hit = (result as { hits?: Array<{ document: Record<string, unknown> }> }).hits?.[0];
            if (hit) {
              const doc = hit.document;
              tsMap.set(`${doc.product_code}|${doc.brand}`, { id: doc.id, name: doc.name, product_code: doc.product_code, brand: doc.brand, image_url: doc.image_url });
            }
          }
        } catch {}
      }

      // Build + sort
      const products = uniqueItems.map((ni) => {
        const ri = ni.responseItem;
        return {
          tecdocCode: ri.productCode, tecdocBrand: ri.productBrand,
          tecdocName: ri.productName || categoryName, genArtID: null,
          product: tsMap.get(`${ri.productCode}|${ri.productBrand}`) || null,
          nextisPrice: ri.price?.unitPrice ?? null, nextisPriceVAT: ri.price?.unitPriceIncVAT ?? null,
          nextisQty: ri.qtyAvailableMain ?? null, nextisDiscount: ri.price?.discount ?? null,
        };
      }).sort((a, b) => {
        const as2 = (a.nextisQty || 0) > 0 ? 1 : 0, bs2 = (b.nextisQty || 0) > 0 ? 1 : 0;
        if (as2 !== bs2) return bs2 - as2;
        return (a.nextisPrice || 9999) - (b.nextisPrice || 9999);
      });

      return Response.json({ products, tecdocCount: uniqueItems.length, categoryName, strategy });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("vehicles API error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

function formatYears(from?: number, to?: number): string {
  if (!from) return "";
  const yr = String(from);
  const f = yr.length >= 6 ? `${yr.slice(4, 6)}.${yr.slice(0, 4)}` : yr;
  if (!to) return `${f} -`;
  const yr2 = String(to);
  const t = yr2.length >= 6 ? `${yr2.slice(4, 6)}.${yr2.slice(0, 4)}` : yr2;
  return `${f} - ${t}`;
}
