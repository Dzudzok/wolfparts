import * as ftp from "basic-ftp";
import { Writable } from "stream";

const FTP_CONFIG = {
  host: process.env.FTP_HOST!,
  user: process.env.FTP_USER!,
  password: process.env.FTP_PASSWORD!,
  secure: false,
};

export async function fetchFileFromFTP(remotePath: string): Promise<string> {
  const client = new ftp.Client();
  try {
    await client.access(FTP_CONFIG);
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk: Buffer, _: string, cb: () => void) {
        chunks.push(chunk);
        cb();
      },
    });
    await client.downloadTo(writable, remotePath);
    return Buffer.concat(chunks).toString("utf-8");
  } finally {
    client.close();
  }
}

export async function listFTPFiles(remotePath: string): Promise<string[]> {
  const client = new ftp.Client();
  try {
    await client.access(FTP_CONFIG);
    const files = await client.list(remotePath);
    return files.map((f) => f.name);
  } finally {
    client.close();
  }
}
