/**
 * Scrapes the TecDoc category tree + genArtIDs from mroauto.cz
 * Walks the category tree for sample engines and collects all categories with genArtIDs.
 *
 * Usage:
 *   npx tsx scripts/scrape-categories.ts
 */

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const BASE = "https://www.mroauto.cz";
const DELAY_MS = 400;

interface CategoryNode {
  nodeId: string;
  name: string;
  isEndNode: boolean;
  href: string;
  genArtIDs: number[];
  children: CategoryNode[];
}

interface CategoryMap {
  [nodeId: string]: {
    name: string;
    path: string[];
    genArtIDs: number[];
  };
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
    if (href.startsWith("javascript:")) return;
    if (!href.startsWith("/")) return;

    nodes.push({
      nodeId: a.attr("data-node-id") || "",
      name: a.find("span.name").text().trim(),
      isEndNode: a.attr("data-is-end-node") === "true",
      href,
      genArtIDs: [],
      children: [],
    });
  });
  return nodes;
}

function extractGenArtIDs($: cheerio.CheerioAPI): number[] {
  const ids = new Set<number>();
  $("div[data-flex-tecdoc-generic-article-id]").each((_, el) => {
    const gid = $(el).attr("data-flex-tecdoc-generic-article-id");
    if (gid) ids.add(parseInt(gid));
  });
  return [...ids];
}

async function walkTree(
  url: string,
  pathSoFar: string[],
  result: CategoryMap,
  depth: number = 0,
  maxDepth: number = 4
): Promise<void> {
  if (depth > maxDepth) return;

  await sleep(DELAY_MS);
  let $: cheerio.CheerioAPI;
  try {
    $ = await fetchPage(url);
  } catch (err: any) {
    console.error(`  ${"  ".repeat(depth)}ERROR fetching: ${err.message}`);
    return;
  }

  const categories = extractCategories($);

  for (const cat of categories) {
    const currentPath = [...pathSoFar, cat.name];
    const indent = "  ".repeat(depth + 1);

    if (cat.isEndNode) {
      // Fetch the end-node page to get genArtIDs
      await sleep(DELAY_MS);
      try {
        const $prod = await fetchPage(cat.href);
        const genArtIDs = extractGenArtIDs($prod);

        if (genArtIDs.length > 0) {
          result[cat.nodeId] = {
            name: cat.name,
            path: currentPath,
            genArtIDs,
          };
          console.log(`${indent}[LEAF] ${cat.name} → genArtIDs: [${genArtIDs.join(", ")}]`);
        } else {
          console.log(`${indent}[LEAF] ${cat.name} → no genArtIDs`);
        }
      } catch (err: any) {
        console.error(`${indent}[LEAF] ${cat.name} → ERROR: ${err.message}`);
      }
    } else {
      console.log(`${indent}[DIR]  ${cat.name}`);
      await walkTree(cat.href, currentPath, result, depth + 1, maxDepth);
    }
  }
}

// Sample engines to scrape — diverse enough to cover most categories
const SAMPLE_ENGINES = [
  {
    label: "SKODA OCTAVIA IV 1.0 TSI",
    url: "/cs/katalog/tecdoc/osobni/skoda/octavia-iv-nx3-nn3-pv3/1-0-tsi/106/40538/141524",
  },
  {
    label: "VW GOLF VIII 2.0 TDI",
    url: "/cs/katalog/tecdoc/osobni/volkswagen/golf-viii-cd1/2-0-tdi/121/40429/139799",
  },
];

async function main() {
  const outputPath = path.join(__dirname, "..", "data", "tecdoc-categories.json");
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const result: CategoryMap = {};

  // Load existing progress if any
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      Object.assign(result, existing);
      console.log(`Loaded ${Object.keys(result).length} existing categories\n`);
    } catch {}
  }

  for (const engine of SAMPLE_ENGINES) {
    console.log(`\n=== ${engine.label} ===\n`);
    await walkTree(engine.url, [], result, 0);

    // Save progress
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nSaved ${Object.keys(result).length} categories so far`);
  }

  // Also build a flat list for the UI (genArtID → category name + path)
  const flatMap: Record<number, { name: string; path: string[] }> = {};
  for (const [_, cat] of Object.entries(result)) {
    for (const gid of cat.genArtIDs) {
      if (!flatMap[gid]) {
        flatMap[gid] = { name: cat.name, path: cat.path };
      }
    }
  }

  const flatPath = path.join(dataDir, "genart-map.json");
  fs.writeFileSync(flatPath, JSON.stringify(flatMap, null, 2));

  console.log(`\nDone! ${Object.keys(result).length} categories, ${Object.keys(flatMap).length} unique genArtIDs`);
  console.log(`Saved to ${outputPath} and ${flatPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
