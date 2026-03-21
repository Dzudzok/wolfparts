/**
 * Scrapes product images from mroauto.cz product pages
 * Images come from TecAlliance CDN (digital-assets.tecalliance.services)
 *
 * Usage:
 *   npx tsx scripts/scrape-images.ts                  # scrape images for products without them (default batch: 100)
 *   npx tsx scripts/scrape-images.ts --limit 500      # scrape up to 500 products
 *   npx tsx scripts/scrape-images.ts --brand MANN-FILTER  # scrape only specific brand
 */

import "dotenv/config";
import axios from "axios";
import Typesense from "typesense";

const DELAY_MS = 500;
const MROAUTO_SEARCH = "https://www.mroauto.cz/cs/hledani";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getTypesenseClient() {
  return new Typesense.Client({
    nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: "https" }],
    apiKey: process.env.TYPESENSE_ADMIN_KEY!,
    connectionTimeoutSeconds: 30,
  });
}

async function searchMroauto(productCode: string, brand: string): Promise<string | null> {
  try {
    // Search on mroauto.cz for the product code
    const searchUrl = `${MROAUTO_SEARCH}?q=${encodeURIComponent(productCode)}`;
    const { data: html } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "cs",
        "Accept": "text/html,application/xhtml+xml",
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    // Look for product detail links in search results
    // Pattern: /cs/hledani/1/9/{code}/.../{brand}/{code}/{id}
    // Or product page with TecAlliance images
    const productLinkMatch = html.match(
      new RegExp(`/cs/hledani/[^"]*/${productCode.toLowerCase().replace(/[^a-z0-9]/g, "[^/]*")}[^"]*`, "i")
    );

    let detailUrl: string | null = null;
    if (productLinkMatch) {
      detailUrl = `https://www.mroauto.cz${productLinkMatch[0]}`;
    }

    // First try: find TecAlliance images directly in the search result page
    const imageUrl = extractTecAllianceImage(html);
    if (imageUrl) return imageUrl;

    // If we found a product detail link, fetch that page
    if (detailUrl) {
      await sleep(300);
      const { data: detailHtml } = await axios.get(detailUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "cs",
        },
        timeout: 15000,
      });
      const detailImage = extractTecAllianceImage(detailHtml);
      if (detailImage) return detailImage;
    }

    return null;
  } catch (err: any) {
    if (err.response?.status === 429) {
      console.log("  Rate limited, waiting 5s...");
      await sleep(5000);
    }
    return null;
  }
}

function extractTecAllianceImage(html: string): string | null {
  // TecAlliance CDN pattern
  const match = html.match(
    /https:\/\/digital-assets\.tecalliance\.services\/images\/\d+\/[a-f0-9]+\.jpg/
  );
  return match ? match[0] : null;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : 100;
  const brandFilter = args.includes("--brand") ? args[args.indexOf("--brand") + 1] : null;

  const client = getTypesenseClient();

  // Find products without images
  console.log(`Searching for products without images${brandFilter ? ` (brand: ${brandFilter})` : ""}...`);

  let filter = 'image_url:=""';
  if (brandFilter) {
    filter += ` && brand:=${brandFilter}`;
  }

  const searchResult = await client.collections("products").documents().search({
    q: "*",
    query_by: "name",
    filter_by: filter,
    per_page: limit,
    sort_by: "stock_qty:desc", // prioritize in-stock items
  });

  const products = searchResult.hits?.map((h) => h.document as Record<string, unknown>) || [];
  console.log(`Found ${products.length} products without images (of ${searchResult.found} total)\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const code = product.product_code as string;
    const brand = product.brand as string;
    const id = product.id as string;

    process.stdout.write(`[${i + 1}/${products.length}] ${brand} ${code}... `);

    try {
      const imageUrl = await searchMroauto(code, brand);

      if (imageUrl) {
        // Update Typesense
        await client.collections("products").documents(id).update({
          image_url: imageUrl,
        });
        console.log(`✓ ${imageUrl.substring(imageUrl.lastIndexOf("/") + 1, imageUrl.lastIndexOf("/") + 13)}...`);
        updated++;
      } else {
        console.log("✗ not found");
        notFound++;
      }
    } catch (err: any) {
      console.log(`✗ error: ${err.message?.substring(0, 50)}`);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
