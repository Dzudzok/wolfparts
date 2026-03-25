import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function getFtpConfig() {
  return {
    host: process.env.FTP_HOST!,
    user: process.env.FTP_USER!,
    password: process.env.FTP_PASSWORD!,
    secure: false,
  };
}

/**
 * Download file from FTP to a temp file, return the path.
 * Use this for large files (>500MB) that don't fit in memory as string.
 */
export async function fetchFileToTemp(remotePath: string): Promise<string> {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  const tempFile = path.join(os.tmpdir(), `wolfparts-csv-${Date.now()}.csv`);
  try {
    await client.access(getFtpConfig());
    await client.downloadTo(tempFile, remotePath);
    return tempFile;
  } finally {
    client.close();
  }
}

/**
 * Download small file from FTP as string (for files <100MB).
 */
export async function fetchFileFromFTP(remotePath: string): Promise<string> {
  const tempFile = await fetchFileToTemp(remotePath);
  try {
    return fs.readFileSync(tempFile, "utf-8");
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

export async function listFTPFiles(remotePath: string): Promise<string[]> {
  const client = new ftp.Client();
  try {
    await client.access(getFtpConfig());
    const files = await client.list(remotePath);
    return files.map((f) => f.name);
  } finally {
    client.close();
  }
}
