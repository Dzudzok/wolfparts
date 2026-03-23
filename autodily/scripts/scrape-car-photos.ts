/**
 * Downloads car photos from TecAlliance Pegasus API
 * URL pattern: https://webservice.tecalliance.services/pegasus-3-0/documents/415/DR{engineId}/0?api_key=...
 *
 * Usage:
 *   npx tsx scripts/scrape-car-photos.ts              # popular brands only
 *   npx tsx scripts/scrape-car-photos.ts --all         # all brands
 *   npx tsx scripts/scrape-car-photos.ts --brand skoda # single brand
 *   npx tsx scripts/scrape-car-photos.ts --limit 100   # first 100 engines
 */

import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const API_KEY = "2BeBXg67wzbzFCs4QjwPEUsEm5Xq3Hq37sDNBnUG71QY2AKCkwBv";
const BASE_URL = "https://webservice.tecalliance.services/pegasus-3-0/documents/415";
const OUTPUT_DIR = path.join(__dirname, "..", "public", "cars");
const CONCURRENCY = 10;
const DELAY_MS = 100;

interface Engine { engineId: number; slug: string; name: string; }
interface Model { modelId: number; slug: string; name: string; engines: Engine[]; }
interface Brand { brandId: number; slug: string; name: string; models: Model[]; }

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function downloadPhoto(engineId: number): Promise<boolean> {
  const filePath = path.join(OUTPUT_DIR, `${engineId}.jpg`);

  // Skip if already exists and non-empty
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    return true;
  }

  try {
    const url = `${BASE_URL}/DR${engineId}/0?api_key=${API_KEY}`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      validateStatus: (s) => s < 500,
    });

    if (res.status === 200 && res.data.length > 1000) {
      fs.writeFileSync(filePath, res.data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function processBatch(engineIds: number[], onProgress: (ok: number, fail: number) => void) {
  let ok = 0, fail = 0;

  for (let i = 0; i < engineIds.length; i += CONCURRENCY) {
    const batch = engineIds.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(id => downloadPhoto(id)));
    results.forEach(r => r ? ok++ : fail++);
    onProgress(ok, fail);
    await sleep(DELAY_MS);
  }

  return { ok, fail };
}

async function main() {
  const args = process.argv.slice(2);
  const scrapeAll = args.includes("--all");
  const brandOnly = args.includes("--brand") ? args[args.indexOf("--brand") + 1] : null;
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : 0;

  // Load tecdoc vehicles
  const dataPath = path.join(__dirname, "..", "data", "tecdoc-vehicles.json");
  if (!fs.existsSync(dataPath)) {
    console.error("tecdoc-vehicles.json not found! Run scrape-tecdoc.ts first.");
    process.exit(1);
  }

  const brands: Brand[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Filter brands
  let selectedBrands: Brand[];
  if (brandOnly) {
    selectedBrands = brands.filter(b => b.slug === brandOnly);
    if (selectedBrands.length === 0) {
      console.error(`Brand "${brandOnly}" not found.`);
      process.exit(1);
    }
  } else if (scrapeAll) {
    selectedBrands = brands;
  } else {
    // Popular brands
    const popular = new Set([
      "audi", "bmw", "citroen", "dacia", "fiat", "ford", "honda", "hyundai",
      "kia", "mazda", "mercedes-benz", "nissan", "opel", "peugeot", "renault",
      "seat", "skoda", "toyota", "volkswagen", "volvo",
    ]);
    selectedBrands = brands.filter(b => popular.has(b.slug));
  }

  // Collect all unique engine IDs
  const engineIds: number[] = [];
  const seen = new Set<number>();
  for (const brand of selectedBrands) {
    for (const model of brand.models) {
      for (const engine of model.engines) {
        if (!seen.has(engine.engineId)) {
          seen.add(engine.engineId);
          engineIds.push(engine.engineId);
        }
      }
    }
  }

  const total = limitArg > 0 ? Math.min(limitArg, engineIds.length) : engineIds.length;
  const toProcess = engineIds.slice(0, total);

  console.log(`\nCar photo scraper`);
  console.log(`Brands: ${selectedBrands.length}, Engines: ${total}`);

  // Ensure output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Count existing
  const existing = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith(".jpg")).length;
  console.log(`Already downloaded: ${existing}`);
  console.log(`Downloading to: ${OUTPUT_DIR}\n`);

  const startTime = Date.now();

  const { ok, fail } = await processBatch(toProcess, (okSoFar, failSoFar) => {
    const done = okSoFar + failSoFar;
    if (done % 50 === 0 || done === total) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (done / parseFloat(elapsed)).toFixed(1);
      console.log(`  ${done}/${total} — ${okSoFar} OK, ${failSoFar} missing — ${elapsed}s (${rate}/s)`);
    }
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith(".jpg")).length;
  console.log(`\nDone! ${ok} downloaded, ${fail} missing — ${elapsed}s`);
  console.log(`Total car photos on disk: ${totalFiles}`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
