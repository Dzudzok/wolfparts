"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  initialQuery?: string;
  large?: boolean;
}

interface SuggestHit {
  id: string;
  name: string;
  product_code: string;
  brand: string;
  price_min: number;
}

export default function SearchBox({ initialQuery = "", large = false }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestHit[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const blurRef = useRef<NodeJS.Timeout>(null);

  const goToSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) {
      setSuggestions([]);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  // Fetch suggestions (not navigate)
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query.trim(), per_page: 6 }),
        });
        const data = await res.json();
        const hits = (data.hits || []).map((h: { document: SuggestHit }) => h.document);
        setSuggestions(hits);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      goToSearch(query);
    }
    if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    blurRef.current = setTimeout(() => { setFocused(false); setSuggestions([]); }, 200);
  };

  const handleFocus = () => {
    if (blurRef.current) clearTimeout(blurRef.current);
    setFocused(true);
  };

  const showDropdown = focused && suggestions.length > 0 && query.trim().length >= 2;

  return (
    <div className={`relative w-full ${large ? "" : "max-w-xl"}`}>
      <div className={`relative flex items-center rounded-xl overflow-hidden transition-all duration-300 ${
        focused
          ? "bg-white shadow-2xl shadow-black/20 ring-2 ring-primary/20"
          : "bg-white/[0.08] hover:bg-white/[0.12]"
      }`}>
        <svg
          className={`absolute left-4 w-[18px] h-[18px] transition-colors ${focused ? "text-primary" : "text-white/30"}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Hledejte díl, OEM kód, VIN..."
          className={`w-full bg-transparent font-medium focus:outline-none pl-11 pr-20 ${
            large ? "py-3 text-[15px]" : "py-2.5 text-sm"
          } ${focused ? "text-mltext-dark placeholder-mltext-light" : "text-white placeholder-white/40"}`}
        />
        {/* Search button */}
        <button
          onMouseDown={(e) => { e.preventDefault(); goToSearch(query); }}
          className={`absolute right-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
            focused && query.trim()
              ? "bg-primary hover:bg-primary-dark text-white"
              : "bg-transparent text-transparent pointer-events-none"
          }`}
        >
          Hledat
        </button>
        {/* Loading indicator */}
        {loading && focused && (
          <div className="absolute right-14 w-4 h-4 rounded-full border-2 border-mlborder border-t-primary animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-mlborder-light overflow-hidden z-50">
          {suggestions.map((hit) => (
            <a
              key={hit.id}
              href={`/product/${hit.id}`}
              onMouseDown={(e) => { e.preventDefault(); router.push(`/product/${hit.id}`); setSuggestions([]); }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-mlborder-light last:border-0"
            >
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-mltext-dark truncate">{hit.name}</span>
                <span className="text-[11px] text-mltext-light">
                  <span className="font-bold uppercase">{hit.brand}</span> · {hit.product_code}
                </span>
              </div>
              {hit.price_min > 0 && (
                <span className="text-sm font-bold text-mltext-dark shrink-0">
                  {hit.price_min.toFixed(0)} <span className="text-mltext-light text-xs">Kč</span>
                </span>
              )}
            </a>
          ))}
          {/* Show all results link */}
          <button
            onMouseDown={(e) => { e.preventDefault(); goToSearch(query); }}
            className="w-full px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/[0.04] transition-colors text-center"
          >
            Zobrazit všechny výsledky →
          </button>
        </div>
      )}
    </div>
  );
}
