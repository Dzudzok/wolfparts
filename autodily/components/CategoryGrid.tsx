"use client";

const categories = [
  { name: "Brzdy", query: "brzdove desticky", image: "/categories/brzdy.jpg" },
  { name: "Spojka", query: "spojka", image: "/categories/spojka.jpg" },
  { name: "Zavěšení", query: "zaveseni", image: "/categories/zaveseni.jpg" },
  { name: "Řízení", query: "rizeni", image: "/categories/rizeni.jpg" },
  { name: "Filtry", query: "filtr", image: "/categories/filtry.jpg" },
  { name: "Řemeny", query: "remen", image: "/categories/remeny.jpg" },
  { name: "Chlazení", query: "chlazeni", image: "/categories/chlazeni.jpg" },
  { name: "Palivo", query: "palivovy", image: "/categories/palivo.jpg" },
  { name: "Těsnění", query: "tesneni", image: "/categories/tesneni.jpg" },
  { name: "Sání", query: "saci system", image: "/categories/sani.jpg" },
  { name: "Výfuk", query: "vyfuk", image: "/categories/vyfuk.jpg" },
  { name: "Klima", query: "klimatizace", image: "/categories/klima.jpg" },
  { name: "Stěrače", query: "sterace", image: "/categories/sterace.jpg" },
  { name: "Elektro", query: "elektroinstalace", image: "/categories/elektro.jpg" },
  { name: "Lambda", query: "lambda sonda", image: "/categories/lambda.jpg" },
  { name: "Tlumiče", query: "tlumic", image: "/categories/tlumic.jpg" },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {categories.map((cat) => (
        <a
          key={cat.name}
          href={`/search?q=${encodeURIComponent(cat.query)}`}
          className="group flex flex-col items-center gap-2 p-3 pb-4 rounded-xl bg-white border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all text-center hover:-translate-y-0.5 relative overflow-hidden"
        >
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-1">
            <img
              src={cat.image}
              alt={cat.name}
              className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <span className="text-mltext text-[13px] font-bold group-hover:text-primary transition-colors leading-tight">
            {cat.name}
          </span>
        </a>
      ))}
    </div>
  );
}
