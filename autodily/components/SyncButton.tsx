"use client";

import { useState } from "react";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_SYNC_SECRET }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(`Chyba: ${data.error}`);
      } else {
        setResult("Sync spusten — produkty se aktualizuji...");
      }
    } catch {
      setResult("Chyba pripojeni");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors border border-gray-300"
      >
        {loading ? "Synchronizuji..." : "Aktualizovat produkty"}
      </button>
      {result && (
        <span className={`text-xs ${result.includes("Chyba") ? "text-red-500" : "text-green-600"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
