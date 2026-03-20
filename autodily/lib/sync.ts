import { fetchFileFromFTP } from "./ftp";
import { parse } from "csv-parse/sync";
import { typesenseAdmin } from "./typesense";

const FTP_PRODUCTS_PATH = process.env.FTP_PRODUCTS_PATH || "/exports/produkty.csv";
const FTP_STOCKS_PATH = process.env.FTP_STOCKS_PATH || "/exports/stany.csv";

function parsePrice(val: string): number {
  if (!val || val === "") return 0;
  return parseFloat(String(val).replace(",", ".")) || 0;
}

function parsePipeList(val: string): string[] {
  if (!val || val === "") return [];
  return val.split("|").filter(Boolean);
}

export async function syncProductsFromCSV(limit?: number): Promise<void> {
  const startTime = Date.now();
  console.log("Pobieranie CSV z FTP...");

  const csvContent = await fetchFileFromFTP(FTP_PRODUCTS_PATH);

  const records: Record<string, string>[] = parse(csvContent, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    bom: true,
  });

  console.log(`Wczytano ${records.length} produktow z CSV`);

  const items = limit ? records.slice(0, limit) : records;
  const BATCH = 1000;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    const docs = batch.map((r) => ({
      id: String(r.ProductID),
      product_code: r.ProductCode || "",
      name: r.Name || "",
      description: r.Description || "",
      brand: r.Brand || "",
      brand_group: r.BrandGroup || "",
      category: r.Category || "",
      assortment: r.AssortmentName || "",
      price_min: parsePrice(r.RetailPriceMin),
      price_max: parsePrice(r.RetailPriceMax),
      purchase_price: parsePrice(r.PurchasePrice),
      in_stock: parsePrice(r.TotalStock) > 0,
      stock_qty: parsePrice(r.TotalStock),
      is_sale: r.IsSale === "1",
      image_url: r.ImageURL || "",
      oem_numbers: parsePipeList(r.OEMNumbers),
      ean_codes: parsePipeList(r.EANCodes),
      cross_numbers: parsePipeList(r.CrossNumbers),
      updated_at: Date.now(),
    }));

    await typesenseAdmin.collections("products").documents().import(docs, { action: "upsert" });

    console.log(
      `Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(items.length / BATCH)} — ${i + batch.length}/${items.length}`
    );
  }

  console.log(
    `Sync zakoncony — ${items.length} produktow — ${((Date.now() - startTime) / 1000).toFixed(1)}s`
  );
}

export async function syncStocksFromCSV(): Promise<void> {
  console.log("Pobieranie stanow z FTP...");

  const csvContent = await fetchFileFromFTP(FTP_STOCKS_PATH);

  const records: Record<string, string>[] = parse(csvContent, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    bom: true,
  });

  console.log(`Aktualizacja ${records.length} stanow...`);

  const BATCH = 1000;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const docs = batch.map((r) => ({
      id: String(r.ProductID),
      price_min: parsePrice(r.RetailPriceMin),
      price_max: parsePrice(r.RetailPriceMax),
      in_stock: parsePrice(r.TotalStock) > 0,
      stock_qty: parsePrice(r.TotalStock),
      updated_at: Date.now(),
    }));

    await typesenseAdmin.collections("products").documents().import(docs, { action: "update" });
  }

  console.log(`Stany zaktualizowane — ${records.length} produktow`);
}
