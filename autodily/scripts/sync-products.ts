import { config } from "dotenv";
config({ path: ".env.local" });

import { syncProductsFromCSV } from "../lib/sync";

const args = process.argv.slice(2);
const limitIndex = args.indexOf("--limit");
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;
const isDryRun = args.includes("--dry-run");
const isReset = args.includes("--reset");

async function main() {
  if (isDryRun) {
    console.log("Dry run — pouze kontrola FTP");
    const { listFTPFiles } = await import("../lib/ftp");
    const files = await listFTPFiles("/");
    console.log("Soubory na FTP:", files);
    return;
  }

  if (isReset) {
    console.log("RESET — mažu kolekci products a vytvářím znovu...");
    const { getTypesenseAdminClient, productsSchema } = await import("../lib/typesense");
    const client = getTypesenseAdminClient();
    try {
      await client.collections("products").delete();
      console.log("Kolekce smazána");
    } catch {
      console.log("Kolekce neexistovala");
    }
    await client.collections().create(productsSchema);
    console.log("Nová kolekce vytvořena\n");
  }

  await syncProductsFromCSV(limit);
}

main().catch((err) => { console.error("Sync failed:", err); process.exit(1); });
