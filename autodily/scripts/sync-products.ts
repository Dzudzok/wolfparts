import { syncProducts } from "../lib/sync";

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;
const dryRun = args.includes("--dry-run");

async function main() {
  try {
    const result = await syncProducts({ limit, dryRun });
    console.log(`\nDone. Synced ${result.synced} products in ${result.totalTime}s`);
    process.exit(0);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

main();
