import { getPool, sql } from "./db";
import { typesenseAdmin, createCollection } from "./typesense";

const BATCH_SIZE = 5000;

const EXPORT_QUERY = `
WITH ProductsDeduped AS (
    SELECT
        g.ID                    AS ProductID,
        g.ProductCode,
        g.Name,
        g.Description,
        g.EshopDescription,
        g.TecDocBrandName       AS Brand,
        g.GroupName             AS BrandGroup,
        g.SubGoupName           AS Category,
        g.AssortmentName,
        MIN(g.RetailPrice)      AS RetailPriceMin,
        MAX(g.RetailPrice)      AS RetailPriceMax,
        MIN(g.PurchasePrice)    AS PurchasePrice,
        g.VATRate,
        g.IsArchiving,
        g.IsSale,
        g.IsHiddenOnEshop
    FROM API_GetProductGroups g
    WHERE g.IsArchiving = 0
      AND g.IsHiddenOnEshop = 0
    GROUP BY
        g.ID, g.ProductCode, g.Name, g.Description, g.EshopDescription,
        g.TecDocBrandName, g.GroupName, g.SubGoupName, g.AssortmentName,
        g.VATRate, g.IsArchiving, g.IsSale, g.IsHiddenOnEshop
)
SELECT
    p.ProductID,
    p.ProductCode,
    p.Name,
    p.Description,
    p.EshopDescription,
    p.Brand,
    p.BrandGroup,
    p.Category,
    p.AssortmentName,
    p.RetailPriceMin,
    p.RetailPriceMax,
    p.PurchasePrice,
    p.IsSale,
    p.IsHiddenOnEshop,
    (SELECT TOP 1 ImageURL
     FROM API_GetImage i
     WHERE i.ProduktGroupID = p.ProductID
     ORDER BY i.Sorting) AS ImageURL,
    ISNULL((
        SELECT SUM(sd.OnStockQuantity)
        FROM API_GetProducts pr
        JOIN API_GetStockDispositions sd ON sd.ProductID = pr.ID
        WHERE pr.GroupID = p.ProductID AND pr.IsArchiving = 0
    ), 0) AS TotalStock,
    ISNULL((
        SELECT DISTINCT oem.OEM + '|'
        FROM API_GetProductOEM oem
        WHERE oem.GroupID = p.ProductID
        FOR XML PATH('')
    ), '') AS OEMNumbers,
    ISNULL((
        SELECT ean.EAN + '|'
        FROM API_GetProductEAN ean
        WHERE ean.GroupID = p.ProductID AND ean.IsArchiving = 0
        FOR XML PATH('')
    ), '') AS EANCodes,
    ISNULL((
        SELECT DISTINCT cn.BrandName + ':' + cn.Code + '|'
        FROM API_GetCrossNumbers cn
        WHERE cn.GroupID = p.ProductID
        FOR XML PATH('')
    ), '') AS CrossNumbers
FROM ProductsDeduped p
ORDER BY p.ProductID
OFFSET @offset ROWS FETCH NEXT @batchSize ROWS ONLY
`;

const COUNT_QUERY = `
SELECT COUNT(DISTINCT ID) AS total
FROM API_GetProductGroups
WHERE IsArchiving = 0 AND IsHiddenOnEshop = 0
`;

interface DBRow {
  ProductID: number;
  ProductCode: string;
  Name: string;
  Description: string;
  EshopDescription: string;
  Brand: string;
  BrandGroup: string;
  Category: string;
  AssortmentName: string;
  RetailPriceMin: string | number;
  RetailPriceMax: string | number;
  PurchasePrice: string | number;
  IsSale: string | boolean;
  ImageURL: string | null;
  TotalStock: string | number;
  OEMNumbers: string;
  EANCodes: string;
  CrossNumbers: string;
}

function parseDecimal(val: string | number): number {
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(",", ".")) || 0;
}

function transformRow(row: DBRow) {
  const stockQty = parseDecimal(row.TotalStock);
  return {
    id: String(row.ProductID),
    product_code: row.ProductCode || "",
    name: row.Name || "",
    description: row.EshopDescription || row.Description || "",
    brand: row.Brand || "",
    brand_group: row.BrandGroup || "",
    category: row.Category || "",
    assortment: row.AssortmentName || "",
    price_min: parseDecimal(row.RetailPriceMin),
    price_max: parseDecimal(row.RetailPriceMax),
    purchase_price: parseDecimal(row.PurchasePrice),
    in_stock: stockQty > 0,
    stock_qty: stockQty,
    is_sale: row.IsSale === "1" || row.IsSale === true,
    image_url: row.ImageURL || "",
    oem_numbers: row.OEMNumbers ? row.OEMNumbers.split("|").filter(Boolean) : [],
    ean_codes: row.EANCodes ? row.EANCodes.split("|").filter(Boolean) : [],
    cross_numbers: row.CrossNumbers ? row.CrossNumbers.split("|").filter(Boolean) : [],
    updated_at: Date.now(),
  };
}

export async function syncProducts(options?: { limit?: number; dryRun?: boolean }) {
  const startTime = Date.now();
  const limit = options?.limit;
  const dryRun = options?.dryRun ?? false;

  console.log(`Starting sync... ${limit ? `(limit: ${limit})` : "(full)"} ${dryRun ? "[DRY RUN]" : ""}`);

  await createCollection();

  const pool = await getPool();

  // Get total count
  const countResult = await pool.request().query(COUNT_QUERY);
  const totalProducts = countResult.recordset[0].total;
  const effectiveTotal = limit ? Math.min(limit, totalProducts) : totalProducts;
  const totalBatches = Math.ceil(effectiveTotal / BATCH_SIZE);

  console.log(`Total products: ${totalProducts}, syncing: ${effectiveTotal}, batches: ${totalBatches}`);

  let synced = 0;

  for (let batch = 0; batch < totalBatches; batch++) {
    const offset = batch * BATCH_SIZE;
    const batchStart = Date.now();
    const currentBatchSize = limit
      ? Math.min(BATCH_SIZE, effectiveTotal - offset)
      : BATCH_SIZE;

    try {
      const request = pool.request();
      request.input("offset", sql.Int, offset);
      request.input("batchSize", sql.Int, currentBatchSize);
      const result = await request.query(EXPORT_QUERY);
      const rows: DBRow[] = result.recordset;

      if (rows.length === 0) break;

      const documents = rows.map(transformRow);

      if (dryRun) {
        console.log(`[DRY RUN] Batch ${batch + 1}/${totalBatches} — ${rows.length} rows — sample:`, documents[0]);
      } else {
        try {
          await typesenseAdmin
            .collections("products")
            .documents()
            .import(documents, { action: "upsert", batch_size: BATCH_SIZE });
        } catch (importError) {
          console.error(`Batch ${batch + 1} import error:`, importError);
        }
      }

      synced += rows.length;
      const batchTime = ((Date.now() - batchStart) / 1000).toFixed(1);
      console.log(`Batch ${batch + 1}/${totalBatches} — offset: ${offset} — ${rows.length} rows — ${batchTime}s`);
    } catch (err) {
      console.error(`Batch ${batch + 1} failed:`, err);
      continue;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nSync complete: ${synced} products in ${totalTime}s`);
  return { synced, totalTime };
}
