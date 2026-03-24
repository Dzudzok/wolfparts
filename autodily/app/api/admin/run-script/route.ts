import { spawn } from "child_process";
import path from "path";

const ALLOWED_SCRIPTS: Record<string, { cmd: string; args: string[] }> = {
  "sync:test": { cmd: "npx", args: ["tsx", "scripts/sync-products.ts", "--reset", "--limit", "500"] },
  "sync:full": { cmd: "npx", args: ["tsx", "scripts/sync-products.ts"] },
  "sync:reset": { cmd: "npx", args: ["tsx", "scripts/sync-products.ts", "--reset"] },
  "scrape:tecdoc": { cmd: "npx", args: ["tsx", "scripts/scrape-tecdoc.ts"] },
  "scrape:tecdoc:all": { cmd: "npx", args: ["tsx", "scripts/scrape-tecdoc.ts", "--all"] },
  "scrape:tecdoc:brand": { cmd: "npx", args: ["tsx", "scripts/scrape-tecdoc.ts", "--brand"] },
  "scrape:images": { cmd: "npx", args: ["tsx", "scripts/scrape-images.ts", "--limit", "100"] },
  "scrape:images:500": { cmd: "npx", args: ["tsx", "scripts/scrape-images.ts", "--limit", "500"] },
  "scrape:images:brand": { cmd: "npx", args: ["tsx", "scripts/scrape-images.ts", "--brand"] },
};

export async function POST(req: Request) {
  const { secret, script, brandSlug } = await req.json();

  if (secret !== process.env.SYNC_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = ALLOWED_SCRIPTS[script];
  if (!entry) {
    return Response.json({ error: `Unknown script: ${script}` }, { status: 400 });
  }

  const cwd = path.resolve(process.cwd());
  const args = [...entry.args];

  // Append brand slug for single-brand scrape
  if (script === "scrape:tecdoc:brand" && brandSlug) {
    args.push(brandSlug);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      };

      send(`[START] ${entry.cmd} ${args.join(" ")}`);

      const child = spawn(entry.cmd, args, {
        cwd,
        shell: true,
        env: { ...process.env },
      });

      child.stdout.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) send(line);
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) send(`[ERR] ${line}`);
      });

      child.on("close", (code) => {
        send(`[DONE] Process exited with code ${code}`);
        close();
      });

      child.on("error", (err) => {
        send(`[ERROR] ${err.message}`);
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
