"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  initialQuery?: string;
  large?: boolean;
}

export default function SearchBox({ initialQuery = "", large = false }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>(null);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 3) handleSearch(val);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      handleSearch(query);
    }
  };

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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Hledejte díl, OEM kód, VIN..."
          className={`w-full bg-transparent font-medium focus:outline-none pl-11 pr-4 ${
            large ? "py-3 text-[15px]" : "py-2.5 text-sm"
          } ${focused ? "text-mltext-dark placeholder-mltext-light" : "text-white placeholder-white/40"}`}
        />
        {focused && query && (
          <button
            onClick={() => handleSearch(query)}
            className="absolute right-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
          >
            Hledat
          </button>
        )}
      </div>
    </div>
  );
}
