import { syncProductsFromCSV, syncStocksFromCSV } from "../lib/sync";

const args = process.argv.slice(2);
const limit = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1])
  : undefined;
const stocksOnly = args.includes("--stocks-only");

async function main() {
  if (stocksOnly) {
    await syncStocksFromCSV();
  } else {
    await syncProductsFromCSV(limit);
  }
}

main().catch(console.error);
