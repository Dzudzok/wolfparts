import { fetchFileToTemp } from "./ftp";
import { parse } from "csv-parse";
import { getTypesenseAdminClient, createCollectionIfNotExists } from "./typesense";
import * as fs from "fs";

function getProductsPath() {
  return process.env.FTP_PRODUCTS_PATH || "/exports/produkty.csv";
}

function parsePrice(val: string | number): number {
  if (!val && val !== 0) return 0;
  return parseFloat(String(val).replace(",", ".")) || 0;
}

function stripHtml(val: string): string {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, "").replace(/["']/g, "").trim();
}

function parsePipeList(val: string): string[] {
  if (!val || val === "") return [];
  return val.split("|").map((s) => s.trim()).filter(Boolean);
}

function stripQuotes(s: string): string {
  return s && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;
}

export async function syncProductsFromCSV(limit?: number): Promise<void> {
  const startTime = Date.now();
  console.log("Pobieranie CSV z FTP...");

  await createCollectionIfNotExists();

  // Download to temp file (avoids memory limit for 500MB+ CSVs)
  const tempFile = await fetchFileToTemp(getProductsPath());
  console.log(`CSV stažen do ${tempFile}`);

  const client = getTypesenseAdminClient();
  const BATCH = 1000;
  let synced = 0;
  let errors = 0;
  let total = 0;
  let batch: Record<string, unknown>[] = [];
  let inStockCount = 0;

  // Stream-parse CSV row by row
  const parser = fs.createReadStream(tempFile, "utf-8").pipe(
    parse({
      delimiter: ";",
      columns: true,
      skip_empty_lines: true,
      quote: false,
      trim: true,
      bom: true,
      relax_column_count: true,
    })
  );

  for await (const rawRow of parser) {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawRow as Record<string, string>)) {
      row[stripQuotes(k)] = stripQuotes(v || "");
    }

    if (!row.ProductID || row.ProductID === "") continue;
    if (limit && total >= limit) break;

    const stockQty = parsePrice(row.TotalStock);
    if (stockQty > 0) inStockCount++;

    batch.push({
      id: String(row.ProductID),
      product_code: stripHtml(row.ProductCode) || "",
      name: stripHtml(row.Name) || "",
      description: stripHtml(row.Description) || "",
      brand: stripHtml(row.Brand) || "Neznama",
      category: stripHtml(row.Category) || "Nezarazeno",
      price_min: parsePrice(row.RetailPriceMin),
      price_max: parsePrice(row.RetailPriceMax),
      in_stock: stockQty > 0,
      stock_qty: stockQty,
      image_url: row.ImageURL || "",
      oem_numbers: parsePipeList(row.OEMNumbers),
      cross_numbers: parsePipeList(row.CrossNumbers),
    });

    total++;

    if (batch.length >= BATCH) {
      const batchNum = Math.floor(synced / BATCH) + 1;
      try {
        await client.collections("products").documents().import(batch, { action: "upsert" });
        synced += batch.length;
      } catch (err: unknown) {
        // Count successes from partial import
        const ie = err as { importResults?: Array<{ success: boolean }> };
        const ok = (ie.importResults || []).filter((r) => r.success).length;
        synced += ok;
        errors += batch.length - ok;
        console.error(`Batch ${batchNum} error: ${ok}/${batch.length} OK`);
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (synced % 10000 < BATCH) {
        console.log(`  ${synced} OK, ${errors} chyb — ${elapsed}s (${inStockCount} skladem)`);
      }
      batch = [];
    }
  }

  // Last batch
  if (batch.length > 0) {
    try {
      await client.collections("products").documents().import(batch, { action: "upsert" });
      synced += batch.length;
    } catch (err: unknown) {
      const ie = err as { importResults?: Array<{ success: boolean }> };
      const ok = (ie.importResults || []).filter((r) => r.success).length;
      synced += ok;
      errors += batch.length - ok;
    }
  }

  // Cleanup temp file
  try { fs.unlinkSync(tempFile); } catch {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nSync dokončen — ${synced} produktů, ${inStockCount} skladem, ${errors} chyb — ${elapsed}s`);
}
