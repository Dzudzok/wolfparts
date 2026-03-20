import { checkItemsByID } from "@/lib/nextis-api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const items = await checkItemsByID([parseInt(id, 10)]);
    const item = items[0];

    if (!item) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json(
      {
        id: item.ID,
        productCode: item.ProductCode,
        productName: item.ProductName,
        productDescription: item.ProductDescription,
        productBrand: item.ProductBrand,
        price: item.Price?.UnitPrice ?? 0,
        priceIncVAT: item.Price?.UnitPriceIncVAT ?? 0,
        priceRetail: item.Price?.UnitPriceRetail ?? 0,
        priceRetailIncVAT: item.Price?.UnitPriceRetailIncVAT ?? 0,
        discount: item.Price?.Discount ?? 0,
        currency: "CZK",
        qty: item.QtyAvailableMain ?? 0,
        qtySupplier: item.QtyAvailableSupplier ?? 0,
        inStock: (item.QtyAvailableMain ?? 0) > 0,
        valid: item.Price?.Valid ?? false,
        oeCodes: item.OECodes ?? [],
        barCodes: item.BarCodes ?? [],
      },
      {
        headers: { "Cache-Control": "public, max-age=300" },
      }
    );
  } catch (err) {
    console.error("product-live error:", err);
    return Response.json({ error: "API error" }, { status: 500 });
  }
}
