import * as ftp from "basic-ftp";
import { Writable } from "stream";

function getFtpConfig() {
  return {
    host: process.env.FTP_HOST!,
    user: process.env.FTP_USER!,
    password: process.env.FTP_PASSWORD!,
    secure: false,
  };
}

export async function fetchFileFromFTP(remotePath: string): Promise<string> {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access(getFtpConfig());
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk, _, cb) {
        chunks.push(Buffer.from(chunk));
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
    await client.access(getFtpConfig());
    const files = await client.list(remotePath);
    return files.map((f) => f.name);
  } finally {
    client.close();
  }
}
