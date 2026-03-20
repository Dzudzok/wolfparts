import { NextRequest, NextResponse } from "next/server";
import { checkItemsByID } from "@/lib/nextis-api";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const items = await checkItemsByID([parseInt(id, 10)]);
    if (!items.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const item = items[0];
    return NextResponse.json(
      {
        price: item.Price.UnitPrice,
        priceIncVAT: item.Price.UnitPriceIncVAT,
        priceRetail: item.Price.UnitPriceRetail,
        priceRetailIncVAT: item.Price.UnitPriceRetailIncVAT,
        discount: item.Price.Discount,
        qty: item.QtyAvailableMain,
        qtySupplier: item.QtyAvailableSupplier,
        valid: item.Price.Valid,
        productName: item.ProductName,
        productCode: item.ProductCode,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error("Product live error:", error);
    return NextResponse.json({ error: "Failed to fetch live data" }, { status: 500 });
  }
}
