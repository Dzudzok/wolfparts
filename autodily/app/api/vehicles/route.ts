import { NextRequest } from "next/server";
import {
  getManufacturers,
  getModelSeries,
  getVehicles,
  getCategoriesForVehicle,
  getBrandsForVehicleCategory,
} from "@/lib/tecdoc-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
import { findByCode } from "@/lib/nextis-api";

/**
 * GET /api/vehicles?action=brands|models|engines|categories|products
 * All data from TecDoc Pegasus API — zero scraping
 */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "brands";

  try {
    // ─── BRANDS ───────────────────────────────────────
    if (action === "brands") {
      const brands = await getManufacturers();
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

      // Step 1: Get category name from TecDoc tree (may fail if rate-limited)
      let categoryName = "";
      try {
        const allCats = await getCategoriesForVehicle(engineId);
        const catNode = allCats.find((c) => c.assemblyGroupNodeId === categoryId);
        categoryName = catNode?.assemblyGroupName || "";
      } catch { /* TecDoc unavailable */ }

      // Step 2: Try TecDoc brands for this vehicle+category (may fail with 401)
      let genericArticleId = 0;
      let tecdocBrandNames: string[] = [];
      try {
        const tecdocBrands = await getBrandsForVehicleCategory(engineId, categoryId);
        genericArticleId = tecdocBrands[0]?.genericArticleId || 0;
        tecdocBrandNames = tecdocBrands.map((b) => b.brandName);
      } catch {
        // TecDoc brands unavailable — we'll search Typesense by category name
      }

      // Step 3: Find seed product code from Typesense
      const client = getTypesenseAdminClient();
      let seedCode = "";

      const popularBrands = ["BOSCH", "MANN-FILTER", "TRW", "VALEO", "HELLA", "SACHS", "FILTRON", "MAHLE", "KNECHT", "SKF", "FEBI BILSTEIN", "MEYLE"];
      const brandsToTry = tecdocBrandNames.length > 0
        ? [...popularBrands.filter((b) => tecdocBrandNames.includes(b)), ...tecdocBrandNames]
        : popularBrands;

      for (const brand of brandsToTry.slice(0, 15)) {
        try {
          const res = await client.collections("products").documents().search({
            q: categoryName,
            query_by: "name,assortment,category",
            filter_by: `brand:=${brand}`,
            per_page: 1,
          });
          const hit = res.hits?.[0]?.document as Record<string, unknown> | undefined;
          if (hit?.product_code) {
            seedCode = hit.product_code as string;
            if (!genericArticleId) {
              // Try to get genericArticleId from TecDoc article search
              try {
                const { getArticleByCode } = await import("@/lib/tecdoc-api");
                const article = await getArticleByCode(seedCode);
                genericArticleId = article?.genericArticles?.[0]?.genericArticleId || 0;
              } catch { /* fallback: use 0 */ }
            }
            break;
          }
        } catch { /* next brand */ }
      }

      // Step 3: Nextis API → get ALL compatible replacements with live prices
      interface NextisItem {
        responseItem: {
          id: number;
          valid: boolean;
          productCode: string;
          productBrand: string;
          productName: string;
          price: { unitPrice: number; unitPriceIncVAT: number; discount: number } | null;
          qtyAvailableMain: number;
        };
      }

      let nextisItems: NextisItem[] = [];
      if (seedCode && genericArticleId) {
        try {
          nextisItems = await findByCode(seedCode, genericArticleId);
        } catch {
          // Nextis API failed — fall back to Typesense only
        }
      }

      // Step 4: Build product list — Nextis items enriched with Typesense data
      const products: Array<{
        tecdocCode: string;
        tecdocBrand: string;
        tecdocName: string;
        genArtID: number | null;
        product: Record<string, unknown> | null;
        nextisPrice: number | null;
        nextisPriceVAT: number | null;
        nextisQty: number | null;
        nextisDiscount: number | null;
      }> = [];

      const seen = new Set<string>();

      for (const ni of nextisItems) {
        const ri = ni.responseItem;
        if (!ri?.productCode) continue;
        const key = `${ri.productCode}|${ri.productBrand}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Try to find in Typesense for extra data (image, our ID)
        let tsProduct: Record<string, unknown> | null = null;
        try {
          const res = await client.collections("products").documents().search({
            q: ri.productCode,
            query_by: "product_code",
            filter_by: `brand:=${ri.productBrand}`,
            per_page: 1,
          });
          const hit = res.hits?.[0]?.document as Record<string, unknown> | undefined;
          if (hit) tsProduct = {
            id: hit.id, name: hit.name, product_code: hit.product_code,
            brand: hit.brand, image_url: hit.image_url,
          };
        } catch { /* not in Typesense */ }

        products.push({
          tecdocCode: ri.productCode,
          tecdocBrand: ri.productBrand,
          tecdocName: ri.productName || categoryName,
          genArtID: genericArticleId,
          product: tsProduct,
          nextisPrice: ri.price?.unitPrice ?? null,
          nextisPriceVAT: ri.price?.unitPriceIncVAT ?? null,
          nextisQty: ri.qtyAvailableMain ?? null,
          nextisDiscount: ri.price?.discount ?? null,
        });
      }

      // Sort: in stock first, then by price
      products.sort((a, b) => {
        const aStock = (a.nextisQty || 0) > 0 ? 1 : 0;
        const bStock = (b.nextisQty || 0) > 0 ? 1 : 0;
        if (aStock !== bStock) return bStock - aStock;
        return (a.nextisPrice || 9999) - (b.nextisPrice || 9999);
      });

      return Response.json({
        products,
        tecdocCount: nextisItems.length || tecdocBrandNames.length,
        categoryName,
        seedCode,
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
