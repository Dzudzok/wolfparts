import { syncProductsFromCSV } from "../lib/sync";

const args = process.argv.slice(2);
const limitIndex = args.indexOf("--limit");
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;
const isDryRun = args.includes("--dry-run");

if (isDryRun) {
  console.log("Dry run — tylko sprawdzanie polaczenia z FTP");
  import("../lib/ftp").then(({ listFTPFiles }) => {
    listFTPFiles("/").then((files) => {
      console.log("Pliki na FTP:", files);
    });
  });
} else {
  syncProductsFromCSV(limit).catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
}
