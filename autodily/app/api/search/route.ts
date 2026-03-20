import { NextRequest, NextResponse } from "next/server";
import { typesenseSearch } from "@/lib/typesense";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      q = "*",
      brand,
      category,
      assortment,
      in_stock,
      is_sale,
      price_min,
      price_max,
      page = 1,
      per_page = 24,
      sort_by,
    } = body;

    const filterParts: string[] = [];
    if (brand) filterParts.push(`brand:=${brand}`);
    if (category) filterParts.push(`category:=${category}`);
    if (assortment) filterParts.push(`assortment:=${assortment}`);
    if (in_stock === true) filterParts.push(`in_stock:=true`);
    if (is_sale === true) filterParts.push(`is_sale:=true`);
    if (price_min !== undefined) filterParts.push(`price_min:>=${price_min}`);
    if (price_max !== undefined) filterParts.push(`price_max:<=${price_max}`);

    const searchParams = {
      q,
      query_by: "name,product_code,ean_codes,oem_numbers,cross_numbers,brand,description",
      query_by_weights: "5,4,4,3,2,2,1",
      facet_by: "brand,category,assortment,in_stock,is_sale",
      filter_by: filterParts.join(" && ") || undefined,
      sort_by: sort_by || (q === "*" ? "stock_qty:desc" : "_text_match:desc,stock_qty:desc"),
      page,
      per_page,
      num_typos: 1,
      typo_tokens_threshold: 2,
      highlight_full_fields: "name,product_code",
    };

    const results = await typesenseSearch
      .collections("products")
      .documents()
      .search(searchParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
