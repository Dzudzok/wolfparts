"use client";

const categories = [
  { name: "Brzdy", query: "brzdove desticky", color: "#E8192C", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" },
  { name: "Spojka", query: "spojka", color: "#8B5CF6", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 3v4M12 17v4M3 12h4M17 12h4" },
  { name: "Zavěšení", query: "zaveseni", color: "#14B8A6", icon: "M4 20h16M6 20V10l6-6 6 6v10M9 14h6M9 17h6" },
  { name: "Řízení", query: "rizeni", color: "#3B82F6", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 7v5l3 3" },
  { name: "Filtry", query: "filtr", color: "#6366F1", icon: "M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-9L4.586 7.586A2 2 0 0 1 4 6.172V4z" },
  { name: "Řemeny", query: "remen", color: "#0EA5E9", icon: "M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { name: "Chlazení", query: "chlazeni", color: "#0EA5E9", icon: "M12 3v18M17.7 7.7L12 12 6.3 7.7M17.7 16.3L12 12l-5.7 4.3M3 12h18" },
  { name: "Palivo", query: "palivovy", color: "#F59E0B", icon: "M6 3h6l2 3H4l2-3zM4 6h10v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM14 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" },
  { name: "Těsnění", query: "tesneni", color: "#64748B", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" },
  { name: "Sání", query: "saci system", color: "#6366F1", icon: "M3 12h3l3-3h4l2 2h6M9 9v8M15 11v6" },
  { name: "Výfuk", query: "vyfuk", color: "#64748B", icon: "M3 14h2l2-2h4l1.5 1.5h3L18 11h3M7 14v4M11 13v5M15.5 13.5v4.5M18 11v7" },
  { name: "Klima", query: "klimatizace", color: "#0EA5E9", icon: "M12 3v3m0 4.5V18m0 3v-3M3 12h3m4.5 0H18m3 0h-3M5.6 5.6l2.15 2.15M14.25 14.25l2.15 2.15M18.4 5.6l-2.15 2.15M9.75 14.25l-2.15 2.15" },
  { name: "Stěrače", query: "sterace", color: "#10B981", icon: "M4 19l8-14 8 14M4 19h16" },
  { name: "Karosérie", query: "karoserie", color: "#E8192C", icon: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9" },
  { name: "Elektro", query: "elektroinstalace", color: "#F59E0B", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { name: "Lambda", query: "lambda sonda", color: "#10B981", icon: "M12 3v18M5 8l7 4-7 4M19 8l-7 4 7 4" },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {categories.map((cat) => (
        <a
          key={cat.name}
          href={`/search?q=${encodeURIComponent(cat.query)}`}
          className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all text-center hover:-translate-y-0.5 relative overflow-hidden"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
            style={{ backgroundColor: cat.color + "0C" }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke={cat.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={cat.icon} />
            </svg>
          </div>
          <span className="text-mltext text-[12px] font-bold group-hover:text-mltext-dark transition-colors leading-tight">
            {cat.name}
          </span>
        </a>
      ))}
    </div>
  );
}
