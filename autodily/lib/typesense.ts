import Typesense from "typesense";

export const productsSchema = {
  name: "products",
  fields: [
    { name: "id", type: "string" as const },
    { name: "product_code", type: "string" as const, facet: true },
    { name: "name", type: "string" as const },
    { name: "description", type: "string" as const, optional: true },
    { name: "brand", type: "string" as const, facet: true },
    { name: "brand_group", type: "string" as const, facet: true },
    { name: "category", type: "string" as const, facet: true },
    { name: "assortment", type: "string" as const, facet: true, optional: true },
    { name: "price_min", type: "float" as const },
    { name: "price_max", type: "float" as const },
    { name: "in_stock", type: "bool" as const, facet: true },
    { name: "stock_qty", type: "float" as const },
    { name: "is_sale", type: "bool" as const, facet: true },
    { name: "image_url", type: "string" as const, optional: true, index: false },
    { name: "oem_numbers", type: "string[]" as const, optional: true },
    { name: "ean_codes", type: "string[]" as const, optional: true },
    { name: "cross_numbers", type: "string[]" as const, optional: true },
    { name: "updated_at", type: "int64" as const },
  ],
  default_sorting_field: "stock_qty",
};

export const carThumbnailsSchema = {
  name: "car_thumbnails",
  fields: [
    { name: "id", type: "string" as const },
    { name: "image_b64", type: "string" as const, index: false },
    { name: "content_type", type: "string" as const, index: false },
    { name: "created_at", type: "int64" as const },
  ],
};

export function getTypesenseAdminClient() {
  return new Typesense.Client({
    nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: "https" }],
    apiKey: process.env.TYPESENSE_ADMIN_KEY!,
    connectionTimeoutSeconds: 30,
  });
}

export function getTypesenseSearchClient() {
  return new Typesense.Client({
    nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: "https" }],
    apiKey: process.env.TYPESENSE_SEARCH_KEY!,
    connectionTimeoutSeconds: 10,
  });
}

export async function createCollectionIfNotExists() {
  const client = getTypesenseAdminClient();
  try {
    await client.collections("products").retrieve();
    console.log("Kolekcja products juz istnieje");
  } catch {
    await client.collections().create(productsSchema);
    console.log("Kolekcja products utworzona");
  }
}
