import Typesense from "typesense";

export const productsSchema = {
  name: "products",
  fields: [
    { name: "id", type: "string" as const },
    { name: "product_code", type: "string" as const, facet: true },
    { name: "name", type: "string" as const },
    { name: "description", type: "string" as const, optional: true },
    { name: "brand", type: "string" as const, facet: true },
    { name: "category", type: "string" as const, facet: true },
    { name: "oem_numbers", type: "string[]" as const, optional: true },
  ],
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
