import { checkItemsByID } from "@/lib/nextis-api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const userToken = req.headers.get("x-user-token") || undefined;

  try {
    // ID from Typesense = Nextis ProductID (numeric)
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const items = await checkItemsByID([numericId], userToken);
    const item = items[0]?.responseItem || {};

    const price = item.price || {};
    const valid = item.valid ?? false;

    return Response.json(
      {
        price: price.unitPrice ?? 0,
        priceVAT: price.unitPriceIncVAT ?? 0,
        priceRetail: price.unitPriceRetail ?? 0,
        discount: price.discount ?? 0,
        currency: price.currency ?? "CZK",
        qty: item.qtyAvailableMain ?? 0,
        inStock: (item.qtyAvailableMain ?? 0) > 0,
        valid,
        productCode: item.productCode || "",
        productBrand: item.productBrand || "",
        isUserPrice: !!userToken,
      },
      { headers: { "Cache-Control": userToken ? "private, no-cache" : "public, s-maxage=300" } }
    );
  } catch (err) {
    console.error("product-live error:", err);
    return Response.json({ error: "API unavailable" }, { status: 503 });
  }
}
