"use client";

const categories = [
  { name: "Autodíly", subtitle: "podle vozu", href: "/search?q=*", image: "/categories/brzdy.jpg" },
  { name: "Oleje", subtitle: "Auto, moto, převodové", href: "/search?q=olej", image: "/categories/oleje.jpg" },
  { name: "Filtry", subtitle: "Vzduchové, olejové, paliva", href: "/search?q=filtr", image: "/categories/filtry.jpg" },
  { name: "Brzdy", subtitle: "Destičky, kotouče, válce", href: "/search?q=brzdy", image: "/categories/brzdy.jpg" },
  { name: "Řemeny", subtitle: "Rozvodové, klínové", href: "/search?q=remen", image: "/categories/remeny.jpg" },
  { name: "Spojka", subtitle: "Sady, ložiska, válce", href: "/search?q=spojka", image: "/categories/spojka.jpg" },
  { name: "Zavěšení", subtitle: "Ramena, čepy, silentbloky", href: "/search?q=zaveseni", image: "/categories/zaveseni.jpg" },
  { name: "Tlumiče", subtitle: "Přední, zadní, pružiny", href: "/search?q=tlumic", image: "/categories/tlumic.jpg" },
  { name: "Výfuk", subtitle: "Katalyzátory, lambda", href: "/search?q=vyfuk", image: "/categories/vyfuk.jpg" },
  { name: "Chlazení", subtitle: "Chladiče, termostaty", href: "/search?q=chlazeni", image: "/categories/chlazeni.jpg" },
  { name: "Elektro", subtitle: "Startéry, alternátory", href: "/search?q=elektro", image: "/categories/elektro.jpg" },
  { name: "Osvětlení", subtitle: "Žárovky, světlomety", href: "/search?q=osvetleni", image: "/categories/osvetleni.jpg" },
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
          <span className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-mlborder-light shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
            <img
              src={cat.image}
              alt=""
              className="w-full h-full object-contain p-0.5"
              loading="lazy"
            />
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
