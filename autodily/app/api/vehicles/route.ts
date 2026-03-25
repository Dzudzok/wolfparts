import { NextRequest } from "next/server";
import {
  getManufacturers,
  getModelSeries,
  getVehicles,
  getCategoriesForVehicle,
} from "@/lib/tecdoc-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
// checkItemsByID no longer needed — using findByVehicle directly
import axios from "axios";

// Cache for vehicle products (avoid re-fetching on page 2, 3, ...)
const vehicleProductsCache = new Map<string, { items: Array<{ responseItem: Record<string, unknown> }>; ts: number }>();
const VP_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function findByVehicle(engineId: number, genArtId: number): Promise<Array<{ responseItem: Record<string, unknown> }>> {
  const cacheKey = `${engineId}:${genArtId}`;
  const cached = vehicleProductsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < VP_CACHE_TTL) return cached.items;
  const BASE = process.env.NEXTIS_API_URL;
  const TOKEN = process.env.NEXTIS_TOKEN_ADMIN;
  const PID = parseInt(process.env.NEXTIS_DEFAULT_PARTNER_ID || "0");
  const { data } = await axios.post(`${BASE}/catalogs/items-finding-by-vehicle`, {
    token: TOKEN, tokenIsMaster: true, tokenPartnerID: PID,
    language: "cs", engineID: engineId, target: "P", genArtID: genArtId,
    getEANCodes: true, getOECodes: true,
  }, { timeout: 20000 });
  const items = data.items || [];
  vehicleProductsCache.set(`${engineId}:${genArtId}`, { items, ts: Date.now() });
  if (vehicleProductsCache.size > 500) {
    const entries = [...vehicleProductsCache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 100; i++) vehicleProductsCache.delete(entries[i][0]);
  }
  return items;
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

      // Categories to hide (no products on e-shop or irrelevant)
      const HIDDEN_CATEGORIES = new Set([
        "Speciální nářadí", "Vedlejší pohon", "Pneumatický systém",
      ]);

      // parentId=-1 → return ALL categories flat (for search)
      if (parentId === -1) {
        const filtered = allNodes.filter((n) => !HIDDEN_CATEGORIES.has(n.assemblyGroupName));
        // Build parent name lookup
        const nameMap = new Map<number, string>();
        for (const n of allNodes) nameMap.set(n.assemblyGroupNodeId, n.assemblyGroupName);
        return Response.json(
          filtered
            .sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
            .map((n) => ({
              nodeId: String(n.assemblyGroupNodeId),
              name: n.assemblyGroupName,
              parentNodeId: n.parentNodeId || null,
              parentName: n.parentNodeId ? nameMap.get(n.parentNodeId) || null : null,
              isEndNode: !n.hasChilds,
            }))
        );
      }

      // Filter to requested level + remove hidden
      const nodes = (parentId === 0
        ? allNodes.filter((n) => !n.parentNodeId)
        : allNodes.filter((n) => n.parentNodeId === parentId)
      ).filter((n) => !HIDDEN_CATEGORIES.has(n.assemblyGroupName));

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

      // Get ALL genArtIDs + category name from TecDoc
      let categoryName = "";
      const genArtIDs: number[] = [];
      try {
        const { getBrandsForVehicleCategory } = await import("@/lib/tecdoc-api");
        const brands = await getBrandsForVehicleCategory(engineId, categoryId);
        // Collect ALL unique genArtIDs (not just first)
        const seen = new Set<number>();
        for (const b of brands) {
          if (b.genericArticleId && !seen.has(b.genericArticleId)) {
            seen.add(b.genericArticleId);
            genArtIDs.push(b.genericArticleId);
          }
        }
        const allCats = await getCategoriesForVehicle(engineId);
        const catNode = allCats.find((c) => c.assemblyGroupNodeId === categoryId);
        categoryName = catNode?.assemblyGroupName || "";
      } catch {}

      if (genArtIDs.length === 0) {
        return Response.json({ products: [], tecdocCount: 0, categoryName, error: "Category not found" });
      }

      // ── Nextis items-finding-by-vehicle — fetch ALL genArtIDs ──
      interface NextisItem { responseItem: Record<string, unknown>; }
      let items: NextisItem[] = [];
      try {
        // Fetch products for all genArtIDs in parallel
        const results = await Promise.all(
          genArtIDs.map((gid) => findByVehicle(engineId, gid).catch(() => []))
        );
        items = results.flat();
      } catch (err) {
        console.error("[vehicles] items-finding-by-vehicle failed:", err instanceof Error ? err.message : err);
      }

      // Deduplicate by code+brand
      const seen = new Set<string>();
      const uniqueItems = items.filter((ni) => {
        const ri = ni.responseItem;
        if (!ri?.productCode) return false;
        const key = `${ri.productCode}|${ri.productBrand}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const client = getTypesenseAdminClient();

      // Build all products sorted: in-stock first, then by price
      const allProducts = uniqueItems.map((ni) => {
        const ri = ni.responseItem as Record<string, unknown>;
        const price = ri.price as Record<string, number> | null;
        return {
          tecdocCode: ri.productCode as string,
          tecdocBrand: ri.productBrand as string,
          tecdocName: (ri.productName as string) || categoryName,
          genArtID: genArtIDs[0] || 0,
          nextisPrice: price?.unitPrice ?? null,
          nextisPriceVAT: price?.unitPriceIncVAT ?? null,
          nextisQty: (ri.qtyAvailableMain as number) ?? null,
          nextisDiscount: price?.discount ?? null,
        };
      }).sort((a, b) => {
        const as2 = (a.nextisQty || 0) > 0 ? 1 : 0, bs2 = (b.nextisQty || 0) > 0 ? 1 : 0;
        if (as2 !== bs2) return bs2 - as2;
        return (a.nextisPrice || 9999) - (b.nextisPrice || 9999);
      });

      // Enrich all items: Typesense (IDs) + TecDoc (criteria/specs)
      const { getArticleByCode } = await import("@/lib/tecdoc-api");

      await Promise.all(allProducts.map(async (p) => {
        const item = p as Record<string, unknown>;
        // Typesense lookup (for product detail link)
        try {
          const res = await client.collections("products").documents().search({
            q: p.tecdocCode, query_by: "product_code", per_page: 1,
          });
          const hit = res.hits?.[0]?.document;
          if (hit) item.product = hit;
        } catch {}

        // TecDoc criteria (specs for filtering)
        try {
          const article = await getArticleByCode(p.tecdocCode, p.tecdocBrand);
          if (article?.articleCriteria?.length) {
            item.criteria = article.articleCriteria.map((c: { criteriaDescription: string; formattedValue: string; criteriaUnitDescription?: string }) => ({
              key: c.criteriaDescription,
              value: c.formattedValue + (c.criteriaUnitDescription ? ` ${c.criteriaUnitDescription}` : ""),
            }));
          }
          if (article?.images?.[0]) {
            item.imageUrl = article.images[0].imageURL400 || article.images[0].imageURL200;
          }
        } catch {}
      }));

      // Build dynamic filters from criteria of ALL products
      const filtersMap = new Map<string, Set<string>>();
      // Add manufacturer (výrobce) filter from product brand
      const brandSet = new Set<string>();
      for (const p of allProducts) {
        if (p.tecdocBrand) brandSet.add(p.tecdocBrand);
      }
      if (brandSet.size >= 1) filtersMap.set("Výrobce", brandSet);

      for (const p of allProducts) {
        const criteria = (p as Record<string, unknown>).criteria as Array<{ key: string; value: string }> | undefined;
        if (!criteria) continue;
        for (const c of criteria) {
          if (!c.key || !c.value) continue;
          if (c.value.length > 50) continue;
          if (c.key.match(/zkušební|svhc|nutně|doplňk/i)) continue;
          if (!filtersMap.has(c.key)) filtersMap.set(c.key, new Set());
          filtersMap.get(c.key)!.add(c.value);
        }
      }

      // Key filters always shown (even with 1 value)
      const ALWAYS_SHOW = /výrobce|montovaná strana|provedení nápravy|strana montáže/i;

      // Convert to array, sort by number of unique values (most useful first)
      const dynamicFilters = [...filtersMap.entries()]
        .filter(([key, values]) => (ALWAYS_SHOW.test(key) ? values.size >= 1 : values.size >= 2) && (ALWAYS_SHOW.test(key) || values.size <= 20))
        .sort((a, b) => {
          // Always-show filters first
          const aKey = ALWAYS_SHOW.test(a[0]) ? -1 : 0;
          const bKey = ALWAYS_SHOW.test(b[0]) ? -1 : 0;
          if (aKey !== bKey) return aKey - bKey;
          return a[1].size - b[1].size;
        })
        .slice(0, 10)
        .map(([key, values]) => ({ key, values: [...values].sort() }));

      return Response.json({
        products: allProducts,
        tecdocCount: allProducts.length,
        categoryName, genArtID: genArtIDs[0] || 0,
        filters: dynamicFilters,
      });
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
