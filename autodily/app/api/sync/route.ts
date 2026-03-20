import { syncProductsFromCSV, syncStocksFromCSV } from "@/lib/sync";

export async function POST(req: Request) {
  const { type, secret } = await req.json();

  if (secret !== process.env.SYNC_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (type === "stocks") {
    syncStocksFromCSV().catch(console.error);
    return Response.json({ status: "stocks sync started" });
  } else {
    syncProductsFromCSV().catch(console.error);
    return Response.json({ status: "full sync started" });
  }
}
