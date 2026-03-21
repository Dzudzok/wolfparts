import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/cart-prices
 * Body: { token: string, items: Array<{ id: string, code: string, brand: string }> }
 * Returns live prices for each item using the user's auth token
 */
export async function POST(req: NextRequest) {
  try {
    const { token, items } = await req.json();

    if (!token || !items?.length) {
      return NextResponse.json({ error: "token and items required" }, { status: 400 });
    }

    // Call Nextis API with user's token
    const res = await axios.post(`${process.env.NEXTIS_API_URL}/catalogs/items-checking-by-id`, {
      Token: token,
      Items: items.map((item: { id: string; code: string; brand: string }) => ({
        Brand: item.brand,
        Code: item.code,
      })),
    }, { timeout: 15000 });

    const results = (res.data.items || res.data.Items || []).map(
      (r: { responseItem: Record<string, unknown> }, i: number) => {
        const resp = r.responseItem || {};
        return {
          id: items[i]?.id,
          valid: resp.valid || false,
          price: (resp.price as { unitPrice?: number })?.unitPrice || 0,
          priceRetail: (resp.price as { unitPriceRetail?: number })?.unitPriceRetail || 0,
          priceVAT: (resp.price as { unitPriceRetailVAT?: number })?.unitPriceRetailVAT || 0,
          discount: (resp.price as { discount?: number })?.discount || 0,
          qty: resp.qtyAvailableMain || 0,
          inStock: (resp.qtyAvailableMain as number) > 0,
        };
      }
    );

    return NextResponse.json({ prices: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
