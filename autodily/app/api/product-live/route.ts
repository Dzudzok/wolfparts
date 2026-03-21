import { getToken } from "@/lib/nextis-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
import { NextRequest } from "next/server";
import axios from "axios";

const BASE_URL = process.env.NEXTIS_API_URL || "https://api.mroauto.nextis.cz";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    // Get product code and brand from Typesense
    const client = getTypesenseAdminClient();
    const product = await client.collections("products").documents(id).retrieve() as Record<string, unknown>;
    const code = product.product_code as string;
    const brand = product.brand as string;

    if (!code || !brand) {
      return Response.json({ error: "Product missing code/brand" }, { status: 404 });
    }

    // Call Nextis API with code + brand
    const token = await getToken();
    const res = await axios.post(`${BASE_URL}/catalogs/items-checking-by-id`, {
      language: "cs",
      token,
      getEANCodes: true,
      getOECodes: true,
      items: [{ code, brand }],
    }, { timeout: 10000 });

    const items = res.data.items || res.data.Items || [];
    const item = items[0]?.responseItem || items[0]?.ResponseItem || {};

    const price = item.price || item.Price || {};
    const valid = item.valid ?? item.Valid ?? false;

    return Response.json(
      {
        price: price.unitPrice ?? price.UnitPrice ?? 0,
        priceVAT: price.unitPriceIncVAT ?? price.UnitPriceIncVAT ?? 0,
        priceRetail: price.unitPriceRetail ?? price.UnitPriceRetail ?? 0,
        discount: price.discount ?? price.Discount ?? 0,
        currency: "CZK",
        qty: item.qtyAvailableMain ?? item.QtyAvailableMain ?? 0,
        inStock: (item.qtyAvailableMain ?? item.QtyAvailableMain ?? 0) > 0,
        valid,
      },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch (err) {
    console.error("product-live error:", err);
    return Response.json({ error: "API unavailable" }, { status: 503 });
  }
}
