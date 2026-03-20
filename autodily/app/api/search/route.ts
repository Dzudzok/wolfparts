import { getTypesenseSearchClient } from "@/lib/typesense";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    q = "*",
    brand,
    category,
    assortment,
    in_stock,
    is_sale,
    page = 1,
    per_page = 24,
    sort = "relevance",
  } = body;

  const filters: string[] = [];
  if (brand) filters.push(`brand:=${brand}`);
  if (category) filters.push(`category:=${category}`);
  if (assortment) filters.push(`assortment:=${assortment}`);
  if (in_stock) filters.push(`in_stock:=true`);
  if (is_sale) filters.push(`is_sale:=true`);

  const sortMap: Record<string, string> = {
    relevance: "_text_match:desc,stock_qty:desc",
    price_asc: "price_min:asc",
    price_desc: "price_min:desc",
    stock: "stock_qty:desc",
  };

  try {
    const client = getTypesenseSearchClient();

    const result = await client
      .collections("products")
      .documents()
      .search({
        q,
        query_by: "name,product_code,ean_codes,oem_numbers,cross_numbers,brand,description",
        query_by_weights: "5,4,4,3,2,2,1",
        facet_by: "brand,category,assortment,in_stock,is_sale",
        max_facet_values: 30,
        filter_by: filters.join(" && ") || undefined,
        sort_by: sortMap[sort] || sortMap.relevance,
        page,
        per_page,
        num_typos: 1,
        typo_tokens_threshold: 2,
        highlight_full_fields: "name,product_code",
        snippet_threshold: 30,
      });

    return Response.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
