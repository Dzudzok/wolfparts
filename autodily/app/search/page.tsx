"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import ProductGrid from "@/components/ProductGrid";
import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";

interface SearchResult {
  found: number;
  hits: Array<{
    document: Record<string, unknown>;
    highlight?: Record<string, { snippet?: string }>;
  }>;
  facet_counts?: Array<{
    field_name: string;
    counts: Array<{ value: string; count: number }>;
  }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "*";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<Record<string, string | boolean | undefined>>(() => {
    const f: Record<string, string | boolean | undefined> = {};
    if (searchParams.get("brand")) f.brand = searchParams.get("brand")!;
    if (searchParams.get("category")) f.category = searchParams.get("category")!;
    if (searchParams.get("assortment")) f.assortment = searchParams.get("assortment")!;
    if (searchParams.get("in_stock") === "true") f.in_stock = true;
    if (searchParams.get("is_sale") === "true") f.is_sale = true;
    return f;
  });

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { q, page, per_page: 24, sort };
      if (filters.brand) body.brand = filters.brand;
      if (filters.category) body.category = filters.category;
      if (filters.assortment) body.assortment = filters.assortment;
      if (filters.in_stock) body.in_stock = true;
      if (filters.is_sale) body.is_sale = true;

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setResults(null);
      } else {
        setResults(data);
      }
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [q, page, filters, sort]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const handleFilterChange = (newFilters: Record<string, string | boolean | undefined>) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    params.set("q", q);
    if (newFilters.brand) params.set("brand", String(newFilters.brand));
    if (newFilters.category) params.set("category", String(newFilters.category));
    if (newFilters.assortment) params.set("assortment", String(newFilters.assortment));
    if (newFilters.in_stock) params.set("in_stock", "true");
    if (newFilters.is_sale) params.set("is_sale", "true");
    router.push(`/search?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = results ? Math.min(Math.ceil(results.found / 24), 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="text-xl font-bold text-gray-900 shrink-0">
            Auto<span className="text-blue-600">Dily</span>
          </a>
          <SearchBox initialQuery={q === "*" ? "" : q} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {q !== "*" ? `Vysledky pro "${q}"` : "Katalog dilu"}
            </h1>
            {results && results.found != null && (
              <p className="text-sm text-gray-500">Nalezeno {results.found.toLocaleString("cs-CZ")} dilu</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Cena (nejnizsi)</option>
              <option value="price_desc">Cena (nejvyssi)</option>
              <option value="stock">Skladem prvni</option>
            </select>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden text-sm border border-gray-300 rounded px-3 py-2 bg-white"
            >
              Filtrovat
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 bg-white rounded-lg border border-gray-200 p-4">
              <Filters
                facets={results?.facet_counts || []}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </aside>

          {/* Mobile drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Filtry</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <Filters
                  facets={results?.facet_counts || []}
                  activeFilters={filters}
                  onFilterChange={(f) => {
                    handleFilterChange(f);
                    setMobileFiltersOpen(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-16" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-6 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <ProductGrid hits={(results?.hits as any) || []} />
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        </div>
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
