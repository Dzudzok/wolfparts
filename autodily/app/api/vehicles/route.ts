import { NextRequest } from "next/server";
import {
  getManufacturers,
  getModelSeries,
  getVehicles,
  getCategoriesForVehicle,
} from "@/lib/tecdoc-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
import { checkItemsByID } from "@/lib/nextis-api";
import axios from "axios";

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
      const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
      if (!engineId || !categoryId) return Response.json({ products: [], tecdocCount: 0, hasMore: false });

      const bs = req.nextUrl.searchParams.get("bs") || "";
      const ms = req.nextUrl.searchParams.get("ms") || "";
      const es = req.nextUrl.searchParams.get("es") || "";
      const bi = req.nextUrl.searchParams.get("bi") || "";
      const mi = req.nextUrl.searchParams.get("mi") || "";

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
      let genArtID = 0;
      let hasMore = false;

      // ── Scrape mroauto.cz → guaranteed vehicle-compatible products ──
      // Fetches only the requested page (16 products per page on mroauto).
      if (bs && ms && es) {
        try {
          const mroBase = `https://www.mroauto.cz/cs/katalog/tecdoc/osobni/${bs}/${ms}/${es}/x/${bi}/${mi}/${engineId}/${categoryId}/`;
          const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
          const url = page === 1 ? mroBase : `${mroBase}?page=${page}`;

          const { data: html } = await axios.get(url, {
            headers: { "User-Agent": UA },
            timeout: 15000,
          });

          // Extract genArtID from TecDoc widget
          const genArtMatch = html.match(/data-flex-tecdoc-generic-article-id="(\d+)"/);
          if (genArtMatch) genArtID = parseInt(genArtMatch[1]);

          // Extract total count (e.g. "43 položek")
          const totalMatch = html.match(/(\d+)\s*polož/);
          const totalProducts = totalMatch ? parseInt(totalMatch[1]) : 0;
          hasMore = totalProducts > page * 16;

          // Extract Nextis product IDs from addToBasket() calls
          const re = /addToBasket\(this,\s*'#ProductItem_(\d+)',\s*'([^']*)',\s*(\d+)/g;
          const nextisIds: number[] = [];
          let m;
          while ((m = re.exec(html)) !== null) {
            nextisIds.push(parseInt(m[1]));
          }

          // Get live prices and stock from Nextis
          if (nextisIds.length > 0) {
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
        } catch (err) {
          console.error("[vehicles] mroauto scrape failed:", err instanceof Error ? err.message : err);
        }
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

      // Batch Typesense lookup for IDs + images
      const client = getTypesenseAdminClient();
      const tsMap = new Map<string, Record<string, unknown>>();
      for (let i = 0; i < Math.min(uniqueItems.length, 100); i += 20) {
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

      // Build + sort: in-stock first, then by price
      const products = uniqueItems.map((ni) => {
        const ri = ni.responseItem;
        return {
          tecdocCode: ri.productCode, tecdocBrand: ri.productBrand,
          tecdocName: ri.productName || categoryName, genArtID,
          product: tsMap.get(`${ri.productCode}|${ri.productBrand}`) || null,
          nextisPrice: ri.price?.unitPrice ?? null, nextisPriceVAT: ri.price?.unitPriceIncVAT ?? null,
          nextisQty: ri.qtyAvailableMain ?? null, nextisDiscount: ri.price?.discount ?? null,
        };
      }).sort((a, b) => {
        const as2 = (a.nextisQty || 0) > 0 ? 1 : 0, bs2 = (b.nextisQty || 0) > 0 ? 1 : 0;
        if (as2 !== bs2) return bs2 - as2;
        return (a.nextisPrice || 9999) - (b.nextisPrice || 9999);
      });

      return Response.json({ products, tecdocCount: uniqueItems.length, categoryName, genArtID, hasMore, page });
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
