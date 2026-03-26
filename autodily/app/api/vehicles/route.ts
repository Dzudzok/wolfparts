import { NextRequest } from "next/server";
import {
  getManufacturers,
  getModelSeries,
  getVehicles,
  getCategoriesForVehicle,
} from "@/lib/tecdoc-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
import axios from "axios";
import http from "http";
import https from "https";

// Keep-alive agents to reuse connections to Nextis API
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 20 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });

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
  const t = Date.now();
  const { data } = await axios.post(`${BASE}/catalogs/items-finding-by-vehicle`, {
    token: TOKEN, tokenIsMaster: true, tokenPartnerID: PID,
    language: "cs", engineID: engineId, target: "P", genArtID: genArtId,
    getEANCodes: true, getOECodes: true,
  }, { timeout: 20000, httpAgent, httpsAgent });
  console.log(`  [nextis] genArt=${genArtId}: ${Date.now() - t}ms, ${(data.items || []).length} items`);
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

      const t0 = Date.now();

      // Get genArtIDs + category name from TecDoc — PARALLEL
      let categoryName = "";
      const genArtIDs: number[] = [];
      const { getBrandsForVehicleCategory } = await import("@/lib/tecdoc-api");

      const [brandsResult, catsResult] = await Promise.all([
        getBrandsForVehicleCategory(engineId, categoryId).catch(() => []),
        getCategoriesForVehicle(engineId).catch(() => []),
      ]);
      console.log(`[products] TecDoc brands+cats: ${Date.now() - t0}ms`);

      const seenGa = new Set<number>();
      for (const b of brandsResult) {
        if (b.genericArticleId && !seenGa.has(b.genericArticleId)) {
          seenGa.add(b.genericArticleId);
          genArtIDs.push(b.genericArticleId);
        }
      }
      const catNode = catsResult.find((c) => c.assemblyGroupNodeId === categoryId);
      categoryName = catNode?.assemblyGroupName || "";

      if (genArtIDs.length === 0) {
        return Response.json({ products: [], tecdocCount: 0, categoryName, error: "Category not found" });
      }

      // ── Nextis items-finding-by-vehicle — ALL genArtIDs in parallel ──
      console.log(`[products] Fetching Nextis for ${genArtIDs.length} genArtIDs...`);
      const t1 = Date.now();
      interface NextisItem { responseItem: Record<string, unknown>; }
      let items: NextisItem[] = [];
      try {
        const results = await Promise.all(
          genArtIDs.map((gid) => findByVehicle(engineId, gid).catch(() => []))
        );
        items = results.flat();
      } catch (err) {
        console.error("[vehicles] items-finding-by-vehicle failed:", err instanceof Error ? err.message : err);
      }
      console.log(`[products] Nextis ${genArtIDs.length} calls: ${Date.now() - t1}ms, ${items.length} items`);

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

      // Typesense lookups — batched via multiSearch (1 request instead of N)
      const t2 = Date.now();
      try {
        const BATCH_SIZE = 50;
        for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
          const batch = allProducts.slice(i, i + BATCH_SIZE);
          const searchRequests = batch.map((p) => ({
            collection: "products",
            q: p.tecdocCode,
            query_by: "product_code",
            per_page: 1,
          }));
          const results = await client.multiSearch.perform({ searches: searchRequests as never }, {});
          for (let j = 0; j < batch.length; j++) {
            const hit = (results.results[j] as { hits?: Array<{ document: unknown }> })?.hits?.[0]?.document;
            if (hit) (batch[j] as Record<string, unknown>).product = hit;
          }
        }
      } catch {}
      console.log(`[products] Typesense ${allProducts.length} lookups (batch): ${Date.now() - t2}ms`);
      console.log(`[products] TOTAL: ${Date.now() - t0}ms`);

      // Brand filter from Nextis data (instant, no TecDoc needed)
      const brandSet = new Set<string>();
      for (const p of allProducts) if (p.tecdocBrand) brandSet.add(p.tecdocBrand);
      const brandFilter = brandSet.size >= 1 ? [{ key: "Výrobce", values: [...brandSet].sort() }] : [];

      return Response.json({
        products: allProducts,
        tecdocCount: allProducts.length,
        categoryName, genArtID: genArtIDs[0] || 0,
        filters: brandFilter,
      });
    }

    // ─── ENRICH — TecDoc criteria + images (called in background by client) ───
    if (action === "enrich") {
      const engineId = parseInt(req.nextUrl.searchParams.get("engineId") || "0");
      const categoryId = parseInt(req.nextUrl.searchParams.get("categoryId") || "0");
      const cacheKey = `enrich_${engineId}_${categoryId}`;

      // Check enrichment cache
      const cached = vehicleProductsCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < VP_CACHE_TTL) {
        return Response.json(cached.items);
      }

      const codesParam = req.nextUrl.searchParams.get("codes") || "";
      const codes = codesParam.split(",").filter(Boolean).map((c) => {
        const sep = c.lastIndexOf("|");
        return { code: c.substring(0, sep), brand: c.substring(sep + 1) };
      });
      if (codes.length === 0) return Response.json({ enriched: {}, filters: [] });

      const { getArticleByCode } = await import("@/lib/tecdoc-api");
      const enriched: Record<string, { criteria?: Array<{ key: string; value: string }>; imageUrl?: string }> = {};
      const filtersMap = new Map<string, Set<string>>();

      const CONCURRENCY = 15;
      for (let i = 0; i < codes.length; i += CONCURRENCY) {
        const batch = codes.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(async ({ code, brand }) => {
          try {
            const article = await getArticleByCode(code, brand);
            const entry: { criteria?: Array<{ key: string; value: string }>; imageUrl?: string } = {};
            if (article?.articleCriteria?.length) {
              entry.criteria = article.articleCriteria.map((c: { criteriaDescription: string; formattedValue: string; criteriaUnitDescription?: string }) => ({
                key: c.criteriaDescription,
                value: c.formattedValue + (c.criteriaUnitDescription ? ` ${c.criteriaUnitDescription}` : ""),
              }));
              // Build filters
              for (const c of entry.criteria) {
                if (!c.key || !c.value || c.value.length > 50) continue;
                if (c.key.match(/zkušební|svhc|nutně|doplňk/i)) continue;
                if (!filtersMap.has(c.key)) filtersMap.set(c.key, new Set());
                filtersMap.get(c.key)!.add(c.value);
              }
            }
            if (article?.images?.[0]) {
              entry.imageUrl = article.images[0].imageURL400 || article.images[0].imageURL200;
            }
            if (entry.criteria || entry.imageUrl) enriched[`${code}|${brand}`] = entry;
          } catch {}
        }));
      }

      const ALWAYS_SHOW = /montovaná strana|provedení nápravy|strana montáže/i;
      const dynamicFilters = [...filtersMap.entries()]
        .filter(([key, values]) => (ALWAYS_SHOW.test(key) ? values.size >= 1 : values.size >= 2) && (ALWAYS_SHOW.test(key) || values.size <= 20))
        .sort((a, b) => {
          const aKey = ALWAYS_SHOW.test(a[0]) ? -1 : 0;
          const bKey = ALWAYS_SHOW.test(b[0]) ? -1 : 0;
          if (aKey !== bKey) return aKey - bKey;
          return a[1].size - b[1].size;
        })
        .slice(0, 10)
        .map(([key, values]) => ({ key, values: [...values].sort() }));

      const result = { enriched, filters: dynamicFilters };
      vehicleProductsCache.set(cacheKey, { items: result as never, ts: Date.now() });
      return Response.json(result);
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
