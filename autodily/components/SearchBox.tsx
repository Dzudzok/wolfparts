"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  initialQuery?: string;
  large?: boolean;
}

export default function SearchBox({ initialQuery = "", large = false }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = useCallback(
    (q: string) => {
      if (q.trim()) {
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }
    },
    [router]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 3) {
        handleSearch(val);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      handleSearch(query);
    }
  };

  return (
    <div className={`relative w-full ${large ? "max-w-2xl" : "max-w-xl"}`}>
      <div className="relative">
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${large ? "w-6 h-6" : "w-5 h-5"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Hledat díly... název, kód OEM, EAN"
          autoFocus={large}
          className={`w-full border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            large ? "pl-12 pr-4 py-4 text-lg" : "pl-10 pr-4 py-2.5 text-base"
          }`}
        />
      </div>
    </div>
  );
}
