// Maps TecDoc category names to SVG icon paths and colors
interface CategoryStyle {
  icon: string;
  color: string;
}

const CATEGORY_MAP: Record<string, CategoryStyle> = {
  // Brakes
  "brzdov": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", color: "#E8192C" },
  "brzd": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", color: "#E8192C" },
  // Filters
  "filtr": { icon: "M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-9L4.586 7.586A2 2 0 0 1 4 6.172V4z", color: "#6366F1" },
  // Engine / Motor
  "motor": { icon: "M7 4v4h10V4M5 8h14v4H5zM9 12v8M15 12v8M7 16h10", color: "#374151" },
  // Cooling
  "chlaz": { icon: "M12 3v18M17.7 7.7L12 12 6.3 7.7M17.7 16.3L12 12l-5.7 4.3M3 12h18", color: "#0EA5E9" },
  // Electrical
  "elektro": { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", color: "#F59E0B" },
  "zapalov": { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", color: "#F59E0B" },
  // Body / Karoserie
  "karos": { icon: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9", color: "#374151" },
  // Climate / AC
  "klima": { icon: "M12 3v3m0 4.5V18m0 3v-3M3 12h3m4.5 0H18m3 0h-3M5.6 5.6l2.15 2.15M14.25 14.25l2.15 2.15M18.4 5.6l-2.15 2.15M9.75 14.25l-2.15 2.15", color: "#0EA5E9" },
  // Exhaust
  "výfuk": { icon: "M3 14h2l2-2h4l1.5 1.5h3L18 11h3M7 14v4M11 13v5M15.5 13.5v4.5M18 11v7", color: "#64748B" },
  "vyfuk": { icon: "M3 14h2l2-2h4l1.5 1.5h3L18 11h3M7 14v4M11 13v5M18 11v7", color: "#64748B" },
  // Suspension / Damping
  "odpruž": { icon: "M12 3v18M8 6l4-3 4 3M8 10h8M8 14h8M8 18l4 3 4-3", color: "#10B981" },
  "tlumen": { icon: "M12 3v18M8 6l4-3 4 3M8 10h8M8 14h8M8 18l4 3 4-3", color: "#10B981" },
  // Steering
  "řízen": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 7v5l3 3", color: "#3B82F6" },
  "rizen": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 7v5l3 3", color: "#3B82F6" },
  // Clutch / Spojka
  "spojk": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M12 3v4M12 17v4M3 12h4M17 12h4", color: "#8B5CF6" },
  // Fuel
  "paliv": { icon: "M6 3h6l2 3H4l2-3zM4 6h10v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM14 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2", color: "#F59E0B" },
  "příprava paliv": { icon: "M6 3h6l2 3H4l2-3zM4 6h10v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z", color: "#F59E0B" },
  // Transmission / Převodovka
  "převod": { icon: "M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", color: "#8B5CF6" },
  // Wheels
  "kola": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0", color: "#374151" },
  "pneu": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0", color: "#374151" },
  // Glass / Windows
  "skel": { icon: "M3 3h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3zM3 9h18", color: "#0EA5E9" },
  "čištění skel": { icon: "M4 19l8-14 8 14M4 19h16", color: "#0EA5E9" },
  "světl": { icon: "M9 21h6M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3z", color: "#EAB308" },
  // Locking
  "zamyk": { icon: "M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z", color: "#374151" },
  // Heating / Ventilation
  "topen": { icon: "M12 3v3m0 4.5V18m0 3v-3M3 12h18", color: "#EF4444" },
  "ventil": { icon: "M12 3v3m0 4.5V18m0 3v-3M3 12h18", color: "#EF4444" },
  // Drive / Pohon
  "pohon": { icon: "M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", color: "#14B8A6" },
  // Belt drive
  "řemen": { icon: "M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", color: "#0EA5E9" },
  // Accessories / Příslušenství
  "přísluš": { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#6B7280" },
  // Service
  "servis": { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0", color: "#6B7280" },
  "kontrol": { icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", color: "#6B7280" },
  // Hybrid
  "hybrid": { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", color: "#10B981" },
  // Pneumatic
  "pneumat": { icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0", color: "#64748B" },
  // Interior
  "vnitřní": { icon: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM9 9h6M9 13h6", color: "#6B7280" },
  // Suspension / Zavěšení
  "zavěšen": { icon: "M4 20h16M6 20V10l6-6 6 6v10M9 14h6M9 17h6", color: "#14B8A6" },
  "náprav": { icon: "M4 20h16M6 20V10l6-6 6 6v10", color: "#14B8A6" },
  // Single-track vehicle
  "jednostop": { icon: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17l3-10h4l3 10", color: "#374151" },
};

// Default fallback
const DEFAULT_STYLE: CategoryStyle = {
  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  color: "#6B7280",
};

export function getCategoryStyle(name: string): CategoryStyle {
  const lower = name.toLowerCase();
  for (const [key, style] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return style;
  }
  return DEFAULT_STYLE;
}

// Maps category names to real product photos
const CATEGORY_IMAGES: Record<string, string> = {
  "brzd": "/categories/brzdy.jpg",
  "spojk": "/categories/spojka.jpg",
  "zavěšen": "/categories/zaveseni.jpg",
  "náprav": "/categories/zaveseni.jpg",
  "řízen": "/categories/rizeni.jpg",
  "rizen": "/categories/rizeni.jpg",
  "filtr": "/categories/filtry.jpg",
  "řemen": "/categories/remeny.jpg",
  "chlaz": "/categories/chlazeni.jpg",
  "paliv": "/categories/palivo.jpg",
  "příprava paliv": "/categories/palivo.jpg",
  "těsn": "/categories/tesneni.jpg",
  "sací": "/categories/sani.jpg",
  "sani": "/categories/sani.jpg",
  "výfuk": "/categories/vyfuk.jpg",
  "vyfuk": "/categories/vyfuk.jpg",
  "klima": "/categories/klima.jpg",
  "stěrač": "/categories/sterace.jpg",
  "karos": "/categories/brzdy.jpg",
  "elektro": "/categories/elektro.jpg",
  "zapalov": "/categories/elektro.jpg",
  "lambd": "/categories/lambda.jpg",
  "olej": "/categories/oleje.jpg",
  "osvětl": "/categories/osvetleni.jpg",
  "světl": "/categories/osvetleni.jpg",
  "motor": "/categories/oleje.jpg",
  "odpruž": "/categories/tlumic.jpg",
  "tlumen": "/categories/tlumic.jpg",
  "pohon": "/categories/remeny.jpg",
  "převod": "/categories/spojka.jpg",
  "kola": "/categories/brzdy.jpg",
  "pneu": "/categories/brzdy.jpg",
  "hybrid": "/categories/elektro.jpg",
  "topen": "/categories/klima.jpg",
  "ventil": "/categories/klima.jpg",
};

export function getCategoryImage(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, img] of Object.entries(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return img;
  }
  return null;
}
