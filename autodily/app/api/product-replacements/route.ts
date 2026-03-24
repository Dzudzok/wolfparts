import { NextRequest, NextResponse } from "next/server";
import { findByCode } from "@/lib/nextis-api";

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 30 * 60 * 1000; // 30 min

/**
 * GET /api/product-replacements?code=GDB1330
 * Returns replacement/compatible parts from Nextis
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json([]);

  const cached = cache.get(code);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, s-maxage=1800" } });
  }

  try {
    const userToken = req.headers.get("x-user-token") || undefined;
    const items = await findByCode(code, 0, "NA", userToken);

    const results = items
      .filter((item: { responseItem: { productCode: string } }) => item.responseItem?.productCode)
      .map((item: { responseItem: Record<string, unknown> }) => {
        const ri = item.responseItem;
        const price = ri.price as Record<string, number> | null;
        return {
          code: ri.productCode as string,
          brand: ri.productBrand as string,
          name: ri.productName as string || "",
          price: price?.unitPrice ?? 0,
          priceVAT: price?.unitPriceIncVAT ?? 0,
          qty: (ri.qtyAvailableMain as number) ?? 0,
        };
      })
      // Sort: in stock first, then by price
      .sort((a: { qty: number; price: number }, b: { qty: number; price: number }) => {
        if (a.qty > 0 && b.qty <= 0) return -1;
        if (a.qty <= 0 && b.qty > 0) return 1;
        return a.price - b.price;
      });

    cache.set(code, { data: results, ts: Date.now() });
    if (cache.size > 5000) {
      const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 1000; i++) cache.delete(entries[i][0]);
    }

    return NextResponse.json(results, { headers: { "Cache-Control": "public, s-maxage=1800" } });
  } catch {
    return NextResponse.json([]);
  }
}
