"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  initialQuery?: string;
  large?: boolean;
}

export default function SearchBox({ initialQuery = "", large = false }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const q = query.trim();
    if (q.length >= 2) {
      router.push(`/search?code=${encodeURIComponent(q)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={`relative w-full ${large ? "max-w-2xl" : "max-w-xl"}`}>
      <div className="relative flex">
        <div className="relative flex-1">
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
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadejte kod dilu, OEM, nebo EAN..."
            autoFocus={large}
            className={`w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              large
                ? "pl-12 pr-4 py-4 text-lg rounded-l-lg"
                : "pl-10 pr-4 py-2.5 text-base rounded-l-lg"
            }`}
          />
        </div>
        <button
          onClick={handleSearch}
          className={`bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors rounded-r-lg shrink-0 ${
            large ? "px-8 text-lg" : "px-5 text-base"
          }`}
        >
          Hledat
        </button>
      </div>
    </div>
  );
}
