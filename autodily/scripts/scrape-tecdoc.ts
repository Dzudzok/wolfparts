/**
 * Scrapes the TecDoc vehicle tree from mroauto.cz
 * Builds an offline JSON map: brands → models → engines (K-types)
 *
 * Usage:
 *   npx tsx scripts/scrape-tecdoc.ts              # scrape all popular brands
 *   npx tsx scripts/scrape-tecdoc.ts --all         # scrape ALL brands (slow, 400+)
 *   npx tsx scripts/scrape-tecdoc.ts --brand skoda # scrape single brand by slug
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const BASE = "https://www.mroauto.cz/cs/katalog/tecdoc/osobni";
const DELAY_MS = 300; // polite crawl delay

// Popular car brands sold in CZ/SK/PL market
const POPULAR_BRAND_SLUGS = new Set([
  "alfa-romeo", "audi", "bmw", "citroen", "dacia", "daewoo", "fiat", "ford",
  "honda", "hyundai", "chevrolet", "jaguar", "jeep", "kia", "lancia", "land-rover",
  "lexus", "mazda", "mercedes-benz", "mini", "mitsubishi", "nissan", "opel",
  "peugeot", "porsche", "renault", "saab", "seat", "skoda", "smart", "subaru",
  "suzuki", "toyota", "volkswagen", "volvo",
]);

interface Engine {
  name: string;
  slug: string;
  engineId: number;
  power: string;
  years: string;
  engineCode: string;
}

interface Model {
  name: string;
  slug: string;
  modelId: number;
  years: string;
  engines: Engine[];
}

interface Brand {
  name: string;
  slug: string;
  brandId: number;
  models: Model[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHTML(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AutoDily-Scraper/1.0)",
      "Accept-Language": "cs",
    },
    timeout: 15000,
  });
  return data;
}


// Strip all HTML tags from a string
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

async function scrapeBrands(): Promise<Array<{ name: string; slug: string; brandId: number }>> {
  console.log("Fetching brands...");
  const html = await fetchHTML(BASE);

  // HTML: <a href="/cs/katalog/tecdoc/osobni/{slug}/{id}"><span></span> BRAND NAME</a>
  // We need to capture everything between > and </a>, then strip inner tags
  const re = /href="\/cs\/katalog\/tecdoc\/osobni\/([a-z0-9-]+)\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
  const brands: Array<{ name: string; slug: string; brandId: number }> = [];
  const seen = new Set<number>();

  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    const brandId = parseInt(m[2]);
    const name = stripTags(m[3]).trim();
    // Skip if slug contains another slash (nested path — not a brand link)
    if (slug.includes("/") || !name) continue;
    if (!seen.has(brandId)) {
      seen.add(brandId);
      brands.push({ name, slug, brandId });
    }
  }

  console.log(`Found ${brands.length} brands`);
  return brands;
}

async function scrapeModels(
  brandSlug: string,
  brandId: number
): Promise<Array<{ name: string; slug: string; modelId: number; years: string }>> {
  const url = `${BASE}/${brandSlug}/${brandId}`;
  const html = await fetchHTML(url);

  // HTML: <a href="/cs/katalog/tecdoc/osobni/{brandSlug}/{modelSlug}/{brandId}/{modelId}">
  //   MODEL NAME (code) MM.YYYY - MM.YYYY</a>
  const re = new RegExp(
    `href="\\/cs\\/katalog\\/tecdoc\\/osobni\\/${brandSlug}\\/([a-z0-9-]+)\\/${brandId}\\/(\\d+)"[^>]*>([\\s\\S]*?)<\\/a>`,
    "g"
  );

  const models: Array<{ name: string; slug: string; modelId: number; years: string }> = [];
  const seen = new Set<number>();
  let m;

  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    const modelId = parseInt(m[2]);
    const fullText = stripTags(m[3]).trim();
    if (!fullText || seen.has(modelId)) continue;
    seen.add(modelId);

    // Text is like "OCTAVIA IV (NX3, NN3, PV3) 01.2020 - Nyní"
    // Split into name and year range
    const yearMatch = fullText.match(/(\d{2}\.\d{4}\s*-\s*(?:\d{2}\.\d{4}|Nyní))/);
    const name = yearMatch
      ? fullText.slice(0, fullText.indexOf(yearMatch[1])).trim()
      : fullText;
    const years = yearMatch ? yearMatch[1] : "";

    models.push({ name, slug, modelId, years });
  }

  return models;
}

async function scrapeEngines(
  brandSlug: string,
  brandId: number,
  modelSlug: string,
  modelId: number
): Promise<Engine[]> {
  const url = `${BASE}/${brandSlug}/${modelSlug}/${brandId}/${modelId}`;
  const html = await fetchHTML(url);

  // Engine entries are in links containing the engine/K-type ID
  // Text content: "1.0 TSI 81 KW / 110 HP Benzín 999 DLAA 8004AUO 06.2020 - Nyní"
  // URL pattern: .../{brandId}/{modelId}/{engineId}
  const engines: Engine[] = [];
  const seen = new Set<number>();

  // Match links with engineSlug/brandId/modelId/engineId
  const re = new RegExp(
    `href="[^"]*\\/([a-z0-9-]+)\\/${brandId}\\/${modelId}\\/(\\d+)"[^>]*>([\\s\\S]*?)<\\/a>`,
    "g"
  );

  let m;
  while ((m = re.exec(html)) !== null) {
    const engineSlug = m[1];
    const engineId = parseInt(m[2]);
    const fullText = stripTags(m[3]).trim();
    if (!fullText || seen.has(engineId)) continue;
    seen.add(engineId);

    // Parse the engine text line
    // Example: "1.0 TSI 81 KW / 110 HP Benzín 999 DLAA 8004AUO 06.2020 - Nyní"
    const powerMatch = fullText.match(/(\d+)\s*[kK][wW]\s*\/\s*(\d+)\s*[hH][pP]/);
    const yearMatch = fullText.match(/(\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{4}|Nyní)/);

    // Engine code: 4-letter uppercase code after HP value (e.g. "DLAA", "DPCA / DXDB")
    // It appears after fuel type and displacement, before the TecDoc article number
    let engineCode = "";
    if (powerMatch) {
      const afterPower = fullText.slice(fullText.indexOf(powerMatch[0]) + powerMatch[0].length);
      // Look for 4-letter codes — skip common words like "Benz", "Nafta" etc.
      const codeMatch = afterPower.match(/\b([A-Z]{4}(?:\s*\/\s*[A-Z]{4})*)\b/);
      if (codeMatch) engineCode = codeMatch[1];
    }

    // Engine name is typically everything before the kW figure
    let name = fullText;
    if (powerMatch) {
      name = fullText.slice(0, fullText.indexOf(powerMatch[0])).trim();
    }

    engines.push({
      name: name || fullText.slice(0, 30),
      slug: engineSlug,
      engineId,
      power: powerMatch ? `${powerMatch[1]} kW / ${powerMatch[2]} HP` : "",
      years: yearMatch ? yearMatch[0] : "",
      engineCode,
    });
  }

  return engines;
}

function loadExistingData(filePath: string): Brand[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Brand[];
  } catch {
    console.warn("Could not parse existing data, starting fresh");
    return [];
  }
}

function mergeEngines(existing: Engine[], scraped: Engine[]): Engine[] {
  const map = new Map<number, Engine>();
  for (const e of existing) map.set(e.engineId, e);
  for (const e of scraped) map.set(e.engineId, e); // new data wins
  return Array.from(map.values());
}

function mergeModels(existing: Model[], scraped: Model[]): Model[] {
  const map = new Map<number, Model>();
  for (const m of existing) map.set(m.modelId, m);
  for (const m of scraped) {
    const prev = map.get(m.modelId);
    if (prev) {
      map.set(m.modelId, { ...m, engines: mergeEngines(prev.engines, m.engines) });
    } else {
      map.set(m.modelId, m);
    }
  }
  return Array.from(map.values());
}

function mergeBrands(existing: Brand[], scraped: Brand): Brand[] {
  const idx = existing.findIndex((b) => b.brandId === scraped.brandId);
  if (idx >= 0) {
    existing[idx] = {
      ...scraped,
      models: mergeModels(existing[idx].models, scraped.models),
    };
  } else {
    existing.push(scraped);
  }
  return existing;
}

async function main() {
  const args = process.argv.slice(2);
  const scrapeAll = args.includes("--all");
  const brandOnly = args.includes("--brand") ? args[args.indexOf("--brand") + 1] : null;

  const outputPath = path.join(__dirname, "..", "data", "tecdoc-vehicles.json");
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Load existing data to merge into
  const result: Brand[] = loadExistingData(outputPath);
  const existingBrandIds = new Set(result.map((b) => b.brandId));
  console.log(`Loaded ${result.length} existing brands from JSON`);

  const allBrands = await scrapeBrands();

  let brandsToScrape: typeof allBrands;
  if (brandOnly) {
    brandsToScrape = allBrands.filter((b) => b.slug === brandOnly);
    if (brandsToScrape.length === 0) {
      console.error(`Brand "${brandOnly}" not found. Available: ${allBrands.map((b) => b.slug).join(", ")}`);
      process.exit(1);
    }
  } else if (scrapeAll) {
    brandsToScrape = allBrands;
  } else {
    brandsToScrape = allBrands.filter((b) => POPULAR_BRAND_SLUGS.has(b.slug));
  }

  console.log(`\nScraping ${brandsToScrape.length} brands (merging with ${result.length} existing)...\n`);

  let added = { brands: 0, models: 0, engines: 0 };

  for (let bi = 0; bi < brandsToScrape.length; bi++) {
    const brand = brandsToScrape[bi];
    const isNew = !existingBrandIds.has(brand.brandId);
    console.log(`[${bi + 1}/${brandsToScrape.length}] ${brand.name} (${brand.brandId})${isNew ? " [NEW]" : ""}...`);

    await sleep(DELAY_MS);
    let models: Awaited<ReturnType<typeof scrapeModels>>;
    try {
      models = await scrapeModels(brand.slug, brand.brandId);
    } catch (err: any) {
      console.error(`  Failed to fetch models: ${err.message}`);
      continue;
    }

    console.log(`  ${models.length} models`);

    const brandEntry: Brand = {
      name: brand.name,
      slug: brand.slug,
      brandId: brand.brandId,
      models: [],
    };

    for (let mi = 0; mi < models.length; mi++) {
      const model = models[mi];
      await sleep(DELAY_MS);

      let engines: Engine[];
      try {
        engines = await scrapeEngines(brand.slug, brand.brandId, model.slug, model.modelId);
      } catch (err: any) {
        console.error(`  Failed to fetch engines for ${model.name}: ${err.message}`);
        engines = [];
      }

      brandEntry.models.push({
        ...model,
        engines,
      });

      if ((mi + 1) % 10 === 0 || mi === models.length - 1) {
        console.log(`  ${mi + 1}/${models.length} models scraped (${engines.length} engines in ${model.name})`);
      }
    }

    // Count what's new before merging
    const prevBrand = result.find((b) => b.brandId === brand.brandId);
    if (!prevBrand) {
      added.brands++;
      added.models += brandEntry.models.length;
      added.engines += brandEntry.models.reduce((s, m) => s + m.engines.length, 0);
    } else {
      for (const m of brandEntry.models) {
        const prevModel = prevBrand.models.find((pm) => pm.modelId === m.modelId);
        if (!prevModel) {
          added.models++;
          added.engines += m.engines.length;
        } else {
          const prevEngineIds = new Set(prevModel.engines.map((e) => e.engineId));
          added.engines += m.engines.filter((e) => !prevEngineIds.has(e.engineId)).length;
        }
      }
    }

    mergeBrands(result, brandEntry);

    // Save progress after each brand
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  }

  // Summary
  const totalModels = result.reduce((s, b) => s + b.models.length, 0);
  const totalEngines = result.reduce(
    (s, b) => s + b.models.reduce((ms, m) => ms + m.engines.length, 0),
    0
  );
  console.log(`\nDone! ${result.length} brands, ${totalModels} models, ${totalEngines} engines`);
  console.log(`New: +${added.brands} brands, +${added.models} models, +${added.engines} engines`);
  console.log(`Saved to ${outputPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
