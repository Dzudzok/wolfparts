"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";
import Footer from "@/components/Footer";

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
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header initialQuery={q === "*" ? "" : q} />

      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
          {/* Title + sort bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-mltext-dark">
                {q !== "*" ? `Výsledky pro "${q}"` : "Katalog dílů"}
              </h1>
              {results && results.found != null && (
                <p className="text-sm text-mltext-light mt-0.5">{results.found.toLocaleString("cs-CZ")} dílů</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm bg-white border-2 border-mlborder rounded-xl px-3 py-2 font-semibold text-mltext focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Cena ↑</option>
                <option value="price_desc">Cena ↓</option>
                <option value="stock">Skladem</option>
              </select>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden text-sm border-2 border-mlborder rounded-xl px-3 py-2 bg-white text-mltext font-semibold hover:border-primary/30 transition-colors flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-9L4.586 7.586A2 2 0 0 1 4 6.172V4z" /></svg>
                Filtry
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20 bg-white rounded-xl border border-mlborder-light p-5 shadow-sm">
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
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-mltext-dark text-lg">Filtry</h2>
                    <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-mltext" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Filters
                    facets={results?.facet_counts || []}
                    activeFilters={filters}
                    onFilterChange={(f) => { handleFilterChange(f); setMobileFiltersOpen(false); }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-mlborder-light overflow-hidden animate-pulse">
                      <div className="aspect-[4/3] bg-gray-50" />
                      <div className="p-4 space-y-2.5">
                        <div className="h-3 bg-gray-100 rounded-full w-16" />
                        <div className="h-3.5 bg-gray-100 rounded-full w-full" />
                        <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
                        <div className="h-5 bg-gray-100 rounded-full w-20 mt-3" />
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
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-mltext-light">Načítání...</div>}>
      <SearchContent />
    </Suspense>
  );
}
