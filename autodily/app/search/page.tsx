"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import ProductGrid from "@/components/ProductGrid";
import type { CatalogItem } from "@/lib/nextis-api";

function SearchContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || code.length < 2) return;

    setLoading(true);
    setError(null);

    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setItems([]);
        } else {
          setItems(data.items || []);
        }
      })
      .catch(() => setError("Chyba pri hledani"))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="text-xl font-bold text-gray-900 shrink-0">
            Auto<span className="text-blue-600">Dily</span>
          </a>
          <SearchBox initialQuery={code} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {code ? `Vysledky pro "${code}"` : "Zadejte kod dilu"}
          </h1>
          {!loading && items.length > 0 && (
            <p className="text-sm text-gray-500">
              Nalezeno {items.length} {items.length === 1 ? "dil" : "dilu"}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse p-5">
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 mb-4" />
                <div className="h-7 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">{error}</p>
            <p className="text-sm text-gray-400 mt-2">Zkuste to znovu nebo zmente hledany kod</p>
          </div>
        ) : code ? (
          <ProductGrid items={items} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Zadejte kod dilu do vyhledavani</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Nacitani...</div>}>
      <SearchContent />
    </Suspense>
  );
}
