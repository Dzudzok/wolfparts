import { searchMultiTarget, type SearchTarget, searchByCode } from "@/lib/nextis-api";

export async function POST(req: Request) {
  try {
    const { code, searchTarget } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return Response.json({ error: "Code is required (min 2 chars)" }, { status: 400 });
    }

    const items = searchTarget
      ? await searchByCode(code.trim(), searchTarget as SearchTarget)
      : await searchMultiTarget(code.trim());

    return Response.json({ items, found: items.length });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
