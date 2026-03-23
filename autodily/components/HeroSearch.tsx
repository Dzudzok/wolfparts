"use client";

import { useState } from "react";

export default function HeroSearch() {
  const [query, setQuery] = useState("");

  function handleSearch() {
    const val = query.trim();
    if (val) window.location.href = `/search?q=${encodeURIComponent(val)}`;
  }

  return (
    <div className="bg-white/[0.07] backdrop-blur-md border border-white/[0.1] rounded-2xl p-6 hover:bg-white/[0.1] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <span className="block text-white font-bold text-[15px]">Hledat díl</span>
          <span className="block text-white/30 text-xs">Kód, OEM, název, VIN</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="Např. GDB1330, olejový filtr..."
          className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl h-12 pl-4 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          onClick={handleSearch}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-primary hover:bg-primary-dark flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
