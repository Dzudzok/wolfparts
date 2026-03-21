"use client";

const categories = [
  { name: "Autodíly", subtitle: "podle vozu", href: "/search?q=*", color: "#D80213", icon: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9" },
  { name: "Oleje", subtitle: "Auto, moto, převodové", href: "/search?q=olej", color: "#F59E0B", icon: "M6 3h6l2 3H4l2-3zM4 6h10v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM14 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" },
  { name: "Filtry", subtitle: "Vzduchové, olejové, paliva", href: "/search?q=filtr", color: "#6366F1", icon: "M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-9L4.586 7.586A2 2 0 0 1 4 6.172V4z" },
  { name: "Brzdy", subtitle: "Destičky, kotouče, válce", href: "/search?q=brzdy", color: "#D80213", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" },
  { name: "Řemeny", subtitle: "Rozvodové, klínové", href: "/search?q=remen", color: "#3B82F6", icon: "M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { name: "Spojka", subtitle: "Sady, ložiska, válce", href: "/search?q=spojka", color: "#8B5CF6", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M12 3v4M12 17v4M3 12h4M17 12h4" },
  { name: "Zavěšení", subtitle: "Ramena, čepy, silentbloky", href: "/search?q=zaveseni", color: "#14B8A6", icon: "M4 20h16M6 20V10l6-6 6 6v10M9 14h6M9 17h6" },
  { name: "Tlumičy", subtitle: "Přední, zadní, pružiny", href: "/search?q=tlumic", color: "#22C55E", icon: "M12 3v18M8 6l4-3 4 3M8 10h8M8 14h8M8 18l4 3 4-3" },
  { name: "Výfuk", subtitle: "Katalyzátory, lambda", href: "/search?q=vyfuk", color: "#64748B", icon: "M3 14h2l2-2h4l1.5 1.5h3L18 11h3M7 14v4M11 13v5M15.5 13.5v4.5M18 11v7" },
  { name: "Chlazení", subtitle: "Chladiče, termostaty", href: "/search?q=chlazeni", color: "#0EA5E9", icon: "M12 3v18M17.7 7.7L12 12 6.3 7.7M17.7 16.3L12 12l-5.7 4.3M3 12h18" },
  { name: "Elektro", subtitle: "Startéry, alternátory", href: "/search?q=elektro", color: "#F59E0B", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { name: "Osvětlení", subtitle: "Žárovky, světlomety", href: "/search?q=osvetleni", color: "#EAB308", icon: "M9 21h6M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3z" },
];

export default function Sidebar() {
  return (
    <nav className="py-3 px-3 space-y-0.5">
      {categories.map((cat) => (
        <a
          key={cat.name}
          href={cat.href}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all group"
        >
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
            style={{ backgroundColor: cat.color + "10" }}
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke={cat.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={cat.icon} />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <span className="block text-mltext-dark text-[14px] font-semibold group-hover:text-primary transition-colors leading-tight">
              {cat.name}
            </span>
            <span className="block text-mltext-light text-[12px] leading-tight mt-0.5">{cat.subtitle}</span>
          </div>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-mlborder group-hover:text-primary/40 shrink-0 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      ))}
    </nav>
  );
}
