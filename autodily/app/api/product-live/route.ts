import { checkItemsByID } from "@/lib/nextis-api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const items = await checkItemsByID([parseInt(id, 10)]);
    const item = items[0]?.responseItem;

    if (!item) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json(
      {
        price: item.Price?.UnitPrice ?? 0,
        priceVAT: item.Price?.UnitPriceIncVAT ?? 0,
        priceRetail: item.Price?.UnitPriceRetail ?? 0,
        discount: item.Price?.Discount ?? 0,
        currency: "CZK",
        qty: item.QtyAvailableMain ?? 0,
        inStock: (item.QtyAvailableMain ?? 0) > 0,
        valid: item.Price?.Valid ?? false,
      },
      {
        headers: { "Cache-Control": "public, s-maxage=300" },
      }
    );
  } catch (err) {
    console.error("product-live error:", err);
    return Response.json({ error: "API unavailable" }, { status: 503 });
  }
}
