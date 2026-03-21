import { NextRequest, NextResponse } from "next/server";
import { searchVin, getVinCategories, getVinParts } from "@/lib/mroauto-session";

/**
 * GET /api/vin?vin=TMBHG41U842869463
 * → logs into mroauto.cz via headless Chrome, scrapes vehicle list
 *
 * GET /api/vin?action=categories&url=https://www.mroauto.cz/cs/katalog/...
 * → scrapes category tree for selected vehicle
 */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  try {
    if (!action) {
      const vin = req.nextUrl.searchParams.get("vin");
      if (!vin || vin.length !== 17) {
        return NextResponse.json({ error: "VIN musí mít 17 znaků" }, { status: 400 });
      }

      const vehicles = await searchVin(vin);
      return NextResponse.json({ vin, vehicles });
    }

    if (action === "categories") {
      const url = req.nextUrl.searchParams.get("url");
      if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

      const categories = await getVinCategories(url);
      return NextResponse.json({ categories });
    }

    if (action === "parts") {
      const url = req.nextUrl.searchParams.get("url");
      if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

      const data = await getVinParts(url);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[VIN API]", err.message);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
