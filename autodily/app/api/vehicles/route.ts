import { NextRequest, NextResponse } from "next/server";
import { getBrands, getModels, getEngines } from "@/lib/tecdoc-data";
import { getCategories, getLeafProducts } from "@/lib/tecdoc-live";
import { getTypesenseAdminClient } from "@/lib/typesense";

// GET /api/vehicles?action=brands
// GET /api/vehicles?action=models&brandId=106
// GET /api/vehicles?action=engines&brandId=106&modelId=40538
// GET /api/vehicles?action=categories&url=/cs/katalog/...&categoryId=100006
// GET /api/vehicles?action=products&leafHref=/cs/katalog/...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");

  try {
    if (action === "brands") {
      return NextResponse.json(getBrands());
    }

    if (action === "models") {
      const brandId = parseInt(searchParams.get("brandId") || "");
      if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });
      return NextResponse.json(getModels(brandId));
    }

    if (action === "engines") {
      const brandId = parseInt(searchParams.get("brandId") || "");
      const modelId = parseInt(searchParams.get("modelId") || "");
      if (!brandId || !modelId)
        return NextResponse.json({ error: "brandId and modelId required" }, { status: 400 });
      return NextResponse.json(getEngines(brandId, modelId));
    }

    // Live categories from mroauto.cz (cached 24h on disk)
    if (action === "categories") {
      const enginePageUrl = searchParams.get("url");
      const categoryId = searchParams.get("categoryId") || undefined;
      if (!enginePageUrl)
        return NextResponse.json({ error: "url required" }, { status: 400 });
      const cats = await getCategories(enginePageUrl, categoryId);

      // Prefetch leaf products in background (warms cache for next click)
      for (const cat of cats) {
        if (cat.isEndNode) {
          getLeafProducts(cat.href).catch(() => {});
        }
      }

      return NextResponse.json(cats);
    }

    // Products from leaf category — scraped from mroauto.cz then matched in Typesense
    if (action === "products") {
      const leafHref = searchParams.get("leafHref");
      if (!leafHref)
        return NextResponse.json({ error: "leafHref required" }, { status: 400 });

      // 1. Get product codes from mroauto.cz
      const tecdocProducts = await getLeafProducts(leafHref);
      if (tecdocProducts.length === 0) {
        return NextResponse.json({ products: [], tecdocCount: 0 });
      }

      // 2. Search each code in Typesense to get our prices/stock
      const client = getTypesenseAdminClient();
      const matched: Array<{
        tecdocCode: string;
        tecdocBrand: string;
        tecdocName: string;
        genArtID: number | null;
        product: Record<string, unknown> | null;
      }> = [];

      // Exact match: filter by product_code for each TecDoc product
      const searches = tecdocProducts.slice(0, 50).map((p) => ({
        collection: "products",
        q: "*",
        filter_by: `product_code:=${p.code}`,
        per_page: 1,
      }));

      try {
        const results = await client.multiSearch.perform({ searches });
        for (let i = 0; i < results.results.length; i++) {
          const res = results.results[i] as { hits?: Array<{ document: Record<string, unknown> }> };
          matched.push({
            tecdocCode: tecdocProducts[i].code,
            tecdocBrand: tecdocProducts[i].brand,
            tecdocName: tecdocProducts[i].name,
            genArtID: tecdocProducts[i].genArtID,
            product: res.hits?.length ? res.hits[0].document : null,
          });
        }
      } catch (err) {
        // Fallback: return tecdoc data without Typesense match
        for (const p of tecdocProducts.slice(0, 50)) {
          matched.push({
            tecdocCode: p.code,
            tecdocBrand: p.brand,
            tecdocName: p.name,
            genArtID: p.genArtID,
            product: null,
          });
        }
      }

      return NextResponse.json({
        products: matched,
        tecdocCount: tecdocProducts.length,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Vehicle API error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
