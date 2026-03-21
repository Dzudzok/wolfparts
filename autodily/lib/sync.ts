import { fetchFileFromFTP } from "./ftp";
import { parse } from "csv-parse/sync";
import { getTypesenseAdminClient, createCollectionIfNotExists } from "./typesense";

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
  return val
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function syncProductsFromCSV(limit?: number): Promise<void> {
  const startTime = Date.now();
  console.log("Pobieranie CSV z FTP...");

  await createCollectionIfNotExists();

  const csvContent = await fetchFileFromFTP(getProductsPath());

  // Strip surrounding quotes from all values — the CSV has nested quote issues
  // in EshopDescription, so we disable quote parsing and clean manually
  const raw: Record<string, string>[] = parse(csvContent, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    quote: false,
    trim: true,
    bom: true,
    relax_column_count: true,
  });

  const stripQuotes = (s: string) =>
    s && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;

  const records = raw.map((row) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[stripQuotes(k)] = stripQuotes(v);
    }
    return clean;
  });

  const items = limit ? records.slice(0, limit) : records;
  console.log(`Przetwarzanie ${items.length} produktow...`);

  const client = getTypesenseAdminClient();
  const BATCH = 1000;
  let synced = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    const docs = batch
      .filter((r) => r.ProductID && r.ProductID !== "")
      .map((r) => ({
        id: String(r.ProductID),
        product_code: stripHtml(r.ProductCode) || "",
        name: stripHtml(r.Name) || "",
        description: stripHtml(r.Description) || "",
        brand: stripHtml(r.Brand) || "Neznama",
        brand_group: stripHtml(r.BrandGroup) || "",
        category: stripHtml(r.Category) || "Nezarazeno",
        assortment: stripHtml(r.AssortmentName) || "",
        price_min: parsePrice(r.RetailPriceMin),
        price_max: parsePrice(r.RetailPriceMax),
        in_stock: parsePrice(r.TotalStock) > 0,
        stock_qty: parsePrice(r.TotalStock),
        is_sale: r.IsSale === "1",
        image_url: r.ImageURL || "",
        oem_numbers: parsePipeList(r.OEMNumbers),
        ean_codes: parsePipeList(r.EANCodes),
        cross_numbers: parsePipeList(r.CrossNumbers),
        updated_at: Date.now(),
      }));

    try {
      const result = await client
        .collections("products")
        .documents()
        .import(docs, { action: "upsert" });

      const failed = (result as Array<{ success: boolean }>).filter((r) => !r.success).length;
      errors += failed;
      synced += docs.length - failed;
    } catch (err) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, err);
      errors += docs.length;
    }

    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(items.length / BATCH);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `Batch ${batchNum}/${totalBatches} — ${synced} OK, ${errors} bledow — ${elapsed}s`
    );
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nSync zakonczony — ${synced} produktow w ${totalTime}s (${errors} bledow)`);
}
