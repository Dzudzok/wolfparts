import { fetchFileFromFTP } from "./ftp";
import { parse } from "csv-parse/sync";
import { getTypesenseAdminClient, createCollectionIfNotExists } from "./typesense";

const FTP_PRODUCTS_PATH = process.env.FTP_PRODUCTS_PATH || "/exports/produkty.csv";

function parsePrice(val: string | number): number {
  if (!val && val !== 0) return 0;
  return parseFloat(String(val).replace(",", ".")) || 0;
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

  const csvContent = await fetchFileFromFTP(FTP_PRODUCTS_PATH);

  const records: Record<string, string>[] = parse(csvContent, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    bom: true,
    relax_column_count: true,
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
        product_code: r.ProductCode || "",
        name: r.Name || "",
        description: r.Description || "",
        brand: r.Brand || "Neznama",
        brand_group: r.BrandGroup || "",
        category: r.Category || "Nezarazeno",
        assortment: r.AssortmentName || "",
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
