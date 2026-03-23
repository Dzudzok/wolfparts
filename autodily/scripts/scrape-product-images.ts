/**
 * Scrapes TecAlliance CDN image URLs from mroauto.cz and updates Typesense
 *
 * Usage:
 *   npx tsx scripts/scrape-product-images.ts              # products without images (default 1000)
 *   npx tsx scripts/scrape-product-images.ts --limit 500   # first 500
 *   npx tsx scripts/scrape-product-images.ts --all          # all products without images
 */

import "dotenv/config";
import axios from "axios";
import { getTypesenseAdminClient } from "../lib/typesense";

const CONCURRENCY = 5;
const DELAY_MS = 200;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getImageUrl(productId: string): Promise<string | null> {
  try {
    const { data: html } = await axios.get(
      `https://www.mroauto.cz/cs/hledani/1/9/x/x/x/x/${productId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "cs",
        },
        timeout: 10000,
      }
    );
    const match = html.match(
      /https:\/\/digital-assets\.tecalliance\.services\/images\/\d+\/[a-f0-9]+\.jpg/
    );
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : 0;
  const all = args.includes("--all");
  const limit = all ? 0 : (limitArg || 1000);

  const client = getTypesenseAdminClient();

  // Find products without images
  console.log("Finding products without images...");
  const perPage = 250;
  let page = 1;
  let productIds: string[] = [];

  while (true) {
    const res = await client.collections("products").documents().search({
      q: "*",
      filter_by: "image_url:=``",
      per_page: perPage,
      page,
      include_fields: "id",
    });

    const hits = (res.hits || []).map((h: { document: { id: string } }) => h.document.id);
    productIds.push(...hits);

    if (hits.length < perPage || (limit > 0 && productIds.length >= limit)) break;
    page++;
  }

  if (limit > 0) productIds = productIds.slice(0, limit);
  console.log(`Found ${productIds.length} products without images\n`);

  if (productIds.length === 0) {
    console.log("All products have images!");
    return;
  }

  let updated = 0, failed = 0, noImage = 0;
  const startTime = Date.now();

  for (let i = 0; i < productIds.length; i += CONCURRENCY) {
    const batch = productIds.slice(i, i + CONCURRENCY);

    const results = await Promise.all(
      batch.map(async (id) => {
        const url = await getImageUrl(id);
        return { id, url };
      })
    );

    // Update Typesense
    for (const { id, url } of results) {
      if (url) {
        try {
          await client.collections("products").documents(id).update({ image_url: url });
          updated++;
        } catch {
          failed++;
        }
      } else {
        noImage++;
      }
    }

    const done = Math.min(i + CONCURRENCY, productIds.length);
    if (done % 50 === 0 || done === productIds.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (done / parseFloat(elapsed)).toFixed(1);
      console.log(`  ${done}/${productIds.length} — ${updated} updated, ${noImage} no image, ${failed} errors — ${elapsed}s (${rate}/s)`);
    }

    await sleep(DELAY_MS);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${updated} images saved, ${noImage} not found, ${failed} errors — ${elapsed}s`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
