/**
 * Scrapes category tree + products for engines from mroauto.cz
 * Saves each engine as data/engines/{engineId}.json
 *
 * Usage:
 *   npx tsx scripts/scrape-engine-categories.ts                    # scrape popular engines from vehicles JSON
 *   npx tsx scripts/scrape-engine-categories.ts --engine 141524    # scrape single engine
 *   npx tsx scripts/scrape-engine-categories.ts --limit 10         # scrape first N engines
 */

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const BASE = "https://www.mroauto.cz";
const DELAY_MS = 300;
const ENGINES_DIR = path.join(__dirname, "..", "data", "engines");

interface CategoryNode {
  nodeId: string;
  name: string;
  isEndNode: boolean;
  href: string;
}

interface Product {
  code: string;
  brand: string;
  name: string;
  genArtID: number | null;
}

interface EngineData {
  engineId: number;
  scrapedAt: string;
  categories: CategoryNode[];
  subcategories: Record<string, CategoryNode[]>;
  products: Record<string, Product[]>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const fullUrl = url.startsWith("/") ? BASE + url : url;
  const { data } = await axios.get(fullUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AutoDily-Scraper/1.0)" },
    timeout: 20000,
  });
  return cheerio.load(data);
}

function extractCategories($: cheerio.CheerioAPI): CategoryNode[] {
  const nodes: CategoryNode[] = [];
  $("a[data-node-id]").each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    if (href.startsWith("javascript:") || !href.startsWith("/")) return;
    nodes.push({
      nodeId: a.attr("data-node-id") || "",
      name: a.find("span.name").text().trim(),
      isEndNode: a.attr("data-is-end-node") === "true",
      href,
    });
  });
  return nodes;
}

function extractProducts($: cheerio.CheerioAPI): Product[] {
  const products: Product[] = [];
  const seen = new Set<string>();

  $("div[data-flex-tecdoc-generic-article-id]").each((_, el) => {
    const div = $(el);
    const genArtID = parseInt(div.attr("data-flex-tecdoc-generic-article-id") || "0") || null;

    let text = "";
    div.find("a").each((_, linkEl) => {
      if (text) return;
      const t = $(linkEl).text().trim().replace(/\s+/g, " ");
      if (t.length >= 5) text = t;
    });
    if (!text) return;

    const words = text.split(/\s+/);
    const brandParts: string[] = [];
    let code = "";
    let nameStart = 0;

    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi];
      if (/^[A-ZÀ-ŽÜÖÄß-]+$/.test(w) && !code) {
        brandParts.push(w);
      } else if (!code && brandParts.length > 0 && /\d/.test(w)) {
        code = w;
        nameStart = wi + 1;
        break;
      } else if (!code && brandParts.length > 0) {
        brandParts.push(w);
      } else {
        break;
      }
    }

    const brand = brandParts.join(" ");
    const name = words.slice(nameStart).join(" ");
    const key = `${brand}:${code}`;

    if (code.length >= 2 && !seen.has(key)) {
      seen.add(key);
      products.push({ code, brand, name, genArtID });
    }
  });

  return products;
}

async function scrapeEngine(enginePageUrl: string, engineId: number): Promise<EngineData> {
  const result: EngineData = {
    engineId,
    scrapedAt: new Date().toISOString(),
    categories: [],
    subcategories: {},
    products: {},
  };

  // 1. Root categories
  const $ = await fetchPage(enginePageUrl);
  result.categories = extractCategories($);
  console.log(`  Root: ${result.categories.length} categories`);

  // 2. Walk each non-leaf category to get subcategories, then scrape leaf products
  for (const cat of result.categories) {
    if (cat.isEndNode) {
      // Directly scrape products
      await sleep(DELAY_MS);
      try {
        const $leaf = await fetchPage(cat.href);
        const prods = extractProducts($leaf);
        if (prods.length > 0) result.products[cat.nodeId] = prods;
      } catch {}
    } else {
      // Get subcategories
      await sleep(DELAY_MS);
      try {
        const $sub = await fetchPage(cat.href);
        const subs = extractCategories($sub);
        result.subcategories[cat.nodeId] = subs;

        // Scrape each leaf subcategory
        for (const sub of subs) {
          if (sub.isEndNode) {
            await sleep(DELAY_MS);
            try {
              const $leaf = await fetchPage(sub.href);
              const prods = extractProducts($leaf);
              if (prods.length > 0) result.products[sub.nodeId] = prods;
            } catch {}
          } else {
            // Go one level deeper
            await sleep(DELAY_MS);
            try {
              const $sub2 = await fetchPage(sub.href);
              const subs2 = extractCategories($sub2);
              result.subcategories[sub.nodeId] = subs2;

              for (const sub2 of subs2) {
                if (sub2.isEndNode) {
                  await sleep(DELAY_MS);
                  try {
                    const $leaf = await fetchPage(sub2.href);
                    const prods = extractProducts($leaf);
                    if (prods.length > 0) result.products[sub2.nodeId] = prods;
                  } catch {}
                }
              }
            } catch {}
          }
        }
      } catch {}
    }
  }

  const totalProducts = Object.values(result.products).reduce((s, p) => s + p.length, 0);
  const totalLeaves = Object.keys(result.products).length;
  console.log(`  Done: ${totalLeaves} leaf categories, ${totalProducts} products`);

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const singleEngine = args.includes("--engine") ? parseInt(args[args.indexOf("--engine") + 1]) : null;
  const limit = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : Infinity;

  fs.mkdirSync(ENGINES_DIR, { recursive: true });

  if (singleEngine) {
    // Need to find the URL for this engine from vehicles JSON
    const vehiclesPath = path.join(__dirname, "..", "data", "tecdoc-vehicles.json");
    const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, "utf-8"));

    let found = false;
    for (const brand of vehicles) {
      for (const model of brand.models) {
        for (const engine of model.engines) {
          if (engine.engineId === singleEngine) {
            const url = `/cs/katalog/tecdoc/osobni/${brand.slug}/${model.slug}/${engine.slug}/${brand.brandId}/${model.modelId}/${engine.engineId}`;
            console.log(`Scraping engine ${singleEngine}: ${brand.name} ${model.name} ${engine.name}`);
            console.log(`URL: ${url}`);
            const data = await scrapeEngine(url, singleEngine);
            fs.writeFileSync(path.join(ENGINES_DIR, `${singleEngine}.json`), JSON.stringify(data));
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (!found) console.error("Engine not found in vehicles JSON");
    return;
  }

  // Scrape engines from vehicles JSON
  const vehiclesPath = path.join(__dirname, "..", "data", "tecdoc-vehicles.json");
  const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, "utf-8"));

  let count = 0;
  for (const brand of vehicles) {
    for (const model of brand.models) {
      for (const engine of model.engines) {
        if (count >= limit) break;
        if (!engine.slug) continue;

        const outPath = path.join(ENGINES_DIR, `${engine.engineId}.json`);
        if (fs.existsSync(outPath)) {
          // Already scraped
          continue;
        }

        const url = `/cs/katalog/tecdoc/osobni/${brand.slug}/${model.slug}/${engine.slug}/${brand.brandId}/${model.modelId}/${engine.engineId}`;
        console.log(`\n[${count + 1}] ${brand.name} ${model.name} ${engine.name} (${engine.engineId})`);

        try {
          const data = await scrapeEngine(url, engine.engineId);
          fs.writeFileSync(outPath, JSON.stringify(data));
        } catch (err: any) {
          console.error(`  FAILED: ${err.message}`);
        }

        count++;
      }
      if (count >= limit) break;
    }
    if (count >= limit) break;
  }

  console.log(`\nDone! Scraped ${count} engines to ${ENGINES_DIR}`);
}

main().catch(console.error);
