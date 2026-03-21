"use client";

import { useState, useRef, useCallback } from "react";

type LogEntry = { text: string; ts: number };

function useScriptRunner() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (script: string, brandSlug?: string) => {
    if (running) return;
    setRunning(true);
    setLogs([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/admin/run-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_SYNC_SECRET,
          script,
          brandSlug,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.text();
        setLogs([{ text: `Error: ${err}`, ts: Date.now() }]);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            try {
              const text = JSON.parse(part.slice(6));
              setLogs((prev) => [...prev, { text, ts: Date.now() }]);
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setLogs((prev) => [...prev, { text: `Connection error: ${err.message}`, ts: Date.now() }]);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [running]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { logs, running, run, stop };
}

function LogPanel({ title, logs, running, onStop }: {
  title: string;
  logs: LogEntry[];
  running: boolean;
  onStop: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new logs
  const prevLen = useRef(0);
  if (logs.length !== prevLen.current) {
    prevLen.current = logs.length;
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <div className="flex items-center gap-2">
          {running && (
            <>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Running</span>
              <button onClick={onStop} className="text-xs text-red-400 hover:text-red-300 ml-2">
                Stop
              </button>
            </>
          )}
          {!running && logs.length > 0 && (
            <span className="text-xs text-gray-500">Done</span>
          )}
        </div>
      </div>
      <div className="p-4 h-72 overflow-y-auto font-mono text-xs leading-relaxed">
        {logs.length === 0 && !running && (
          <span className="text-gray-600">No logs yet. Click a button to start.</span>
        )}
        {logs.map((entry, i) => (
          <div
            key={i}
            className={
              entry.text.startsWith("[ERR]")
                ? "text-red-400"
                : entry.text.startsWith("[DONE]")
                ? "text-green-400 font-semibold"
                : entry.text.startsWith("[START]")
                ? "text-blue-400"
                : entry.text.includes("NEW")
                ? "text-yellow-300"
                : "text-gray-300"
            }
          >
            {entry.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const sync = useScriptRunner();
  const scrape = useScriptRunner();
  const images = useScriptRunner();
  const [brandSlug, setBrandSlug] = useState("");
  const [imageBrand, setImageBrand] = useState("");

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-2xl font-bold text-gray-900">
              Auto<span className="text-blue-600">Dily</span>
            </a>
            <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <a href="/" className="hover:text-blue-600">E-shop</a>
            <a href="/search?q=*" className="hover:text-blue-600">Katalog</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Sync Products */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Synchronizace produktu</h2>
          <p className="text-sm text-gray-500 mb-4">
            Stahne CSV z FTP a aktualizuje produkty v Typesense
          </p>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => sync.run("sync:test")}
              disabled={sync.running}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {sync.running ? "Bezi..." : "Sync test (500)"}
            </button>
            <button
              onClick={() => sync.run("sync:full")}
              disabled={sync.running}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {sync.running ? "Bezi..." : "Sync plny"}
            </button>
          </div>
          <LogPanel title="Sync log" logs={sync.logs} running={sync.running} onStop={sync.stop} />
        </section>

        {/* Scrape TecDoc */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">TecDoc scraper</h2>
          <p className="text-sm text-gray-500 mb-4">
            Scrapuje marky, modely a motory z mroauto.cz — merguje s existujicimi daty
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => scrape.run("scrape:tecdoc")}
              disabled={scrape.running}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {scrape.running ? "Bezi..." : "Popularni marky (~35)"}
            </button>
            <button
              onClick={() => scrape.run("scrape:tecdoc:all")}
              disabled={scrape.running}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {scrape.running ? "Bezi..." : "Vsechny marky (400+)"}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={brandSlug}
                onChange={(e) => setBrandSlug(e.target.value.toLowerCase().trim())}
                placeholder="slug marky, napr. skoda"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={() => brandSlug && scrape.run("scrape:tecdoc:brand", brandSlug)}
                disabled={scrape.running || !brandSlug}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                Jedna marka
              </button>
            </div>
          </div>
          <LogPanel title="Scraper log" logs={scrape.logs} running={scrape.running} onStop={scrape.stop} />
        </section>

        {/* Scrape Images */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Obrázky produktů</h2>
          <p className="text-sm text-gray-500 mb-4">
            Scrapuje obrázky z mroauto.cz (TecAlliance CDN) pro produkty bez fotek
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => images.run("scrape:images")}
              disabled={images.running}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {images.running ? "Běží..." : "Scrape 100 fotek"}
            </button>
            <button
              onClick={() => images.run("scrape:images:500")}
              disabled={images.running}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {images.running ? "Běží..." : "Scrape 500 fotek"}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageBrand}
                onChange={(e) => setImageBrand(e.target.value.toUpperCase().trim())}
                placeholder="MANN-FILTER, BOSCH..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <button
                onClick={() => imageBrand && images.run("scrape:images:brand", imageBrand)}
                disabled={images.running || !imageBrand}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                Jedna značka
              </button>
            </div>
          </div>
          <LogPanel title="Images log" logs={images.logs} running={images.running} onStop={images.stop} />
        </section>
      </div>
    </main>
  );
}
