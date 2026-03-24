import { checkItemsByCode } from "@/lib/nextis-api";
import { getTypesenseAdminClient } from "@/lib/typesense";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  // User token from header (if logged in)
  const userToken = req.headers.get("x-user-token") || undefined;

  try {
    // Get product code and brand from Typesense
    const client = getTypesenseAdminClient();
    const product = await client.collections("products").documents(id).retrieve() as Record<string, unknown>;
    const code = product.product_code as string;
    const brand = product.brand as string;

    if (!code || !brand) {
      return Response.json({ error: "Product missing code/brand" }, { status: 404 });
    }

    // Call Nextis — with user token (their prices) or master token (catalog prices)
    const items = await checkItemsByCode([{ code, brand }], userToken);
    const item = items[0]?.responseItem || items[0]?.ResponseItem || {};

    const price = item.price || item.Price || {};
    const valid = item.valid ?? item.Valid ?? false;

    return Response.json(
      {
        price: price.unitPrice ?? price.UnitPrice ?? 0,
        priceVAT: price.unitPriceIncVAT ?? price.UnitPriceIncVAT ?? 0,
        priceRetail: price.unitPriceRetail ?? price.UnitPriceRetail ?? 0,
        discount: price.discount ?? price.Discount ?? 0,
        currency: price.currency ?? "CZK",
        qty: item.qtyAvailableMain ?? item.QtyAvailableMain ?? 0,
        inStock: (item.qtyAvailableMain ?? item.QtyAvailableMain ?? 0) > 0,
        valid,
        isUserPrice: !!userToken,
      },
      { headers: { "Cache-Control": userToken ? "private, no-cache" : "public, s-maxage=300" } }
    );
  } catch (err) {
    console.error("product-live error:", err);
    return Response.json({ error: "API unavailable" }, { status: 503 });
  }
}
