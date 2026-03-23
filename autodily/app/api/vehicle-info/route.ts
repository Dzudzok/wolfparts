import { NextRequest, NextResponse } from "next/server";
import { getVehicleById, getCarPhotoProxyUrl } from "@/lib/tecdoc-api";

// Cache
const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * GET /api/vehicle-info?engineId=3726
 * Vehicle photo + specs from TecDoc API — zero scraping
 */
export async function GET(req: NextRequest) {
  const engineId = req.nextUrl.searchParams.get("engineId");
  if (!engineId) return NextResponse.json({ error: "Missing engineId" }, { status: 400 });

  const cached = cache.get(engineId);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, max-age=604800" } });
  }

  const imageUrl = getCarPhotoProxyUrl(engineId);

  const info: Record<string, string> = {
    imageUrl,
    power: "",
    engineCodes: "",
    fuel: "",
    years: "",
    body: "",
    driveType: "",
    capacity: "",
  };

  try {
    const vehicle = await getVehicleById(parseInt(engineId));
    if (vehicle) {
      if (vehicle.powerKwFrom) info.power = `${vehicle.powerKwFrom} kW / ${vehicle.powerHpFrom} HP`;
      if (vehicle.engineCodes) info.engineCodes = vehicle.engineCodes;
      if (vehicle.fuelType) info.fuel = vehicle.fuelType;
      if (vehicle.bodyType) info.body = vehicle.bodyType;
      if (vehicle.driveType) info.driveType = vehicle.driveType;
      if (vehicle.capacityCcm) info.capacity = `${vehicle.capacityCcm} ccm`;

      const from = vehicle.yearOfConstFrom;
      const to = vehicle.yearOfConstTo;
      if (from) {
        const f = String(from);
        const fFmt = f.length >= 6 ? `${f.slice(4, 6)}.${f.slice(0, 4)}` : f;
        if (to) {
          const t = String(to);
          const tFmt = t.length >= 6 ? `${t.slice(4, 6)}.${t.slice(0, 4)}` : t;
          info.years = `${fFmt} - ${tFmt}`;
        } else {
          info.years = `${fFmt} -`;
        }
      }
    }
  } catch {
    // API failed — return just the photo
  }

  cache.set(engineId, { data: info, ts: Date.now() });
  if (cache.size > 10000) {
    const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 2000; i++) cache.delete(entries[i][0]);
  }

  return NextResponse.json(info, { headers: { "Cache-Control": "public, max-age=604800" } });
}
