import { syncProductsFromCSV } from "@/lib/sync";

export async function POST(req: Request) {
  const { secret } = await req.json();

  if (secret !== process.env.SYNC_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  syncProductsFromCSV().catch(console.error);

  return Response.json({ status: "sync started" });
}
