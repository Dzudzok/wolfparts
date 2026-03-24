"use client";

import { useState, useEffect } from "react";

interface Category { nodeId: string; name: string; isEndNode: boolean; }
interface Props {
  categories: Category[];
  onSelect: (cat: Category & { href: string }) => void;
  engineId?: string;
  hoveredCategoryId?: string | null;
}

function findCat(kw: string, cats: Category[]): Category | null {
  const k = kw.toLowerCase();
  for (const c of cats) {
    const n = c.name.toLowerCase();
    if (n === k || (k.length > 4 && n.includes(k)) || (n.length > 4 && k.includes(n))) return c;
  }
  const frags: [string, string][] = [
    ["kotoučová","kotoučová"],["třmen","třmen"],["bubnová","bubnová"],["parkovací","parkovací"],
    ["váleček","váleček"],["hadičk","hadičk"],["potrubí","potrubí"],["posilovač","posilovač"],
    ["hlavní","hlavní"],["regulátor","regulátor"],["spínač","spínač"],["kapalin","kapalin"],
    ["výkonné","výkonné"],["výkonný","výkonný"],["nádrž","nádrž"],["simulátor","simulátor"],
    ["filtr","filtr"],["kotouč","kotouč"],["obložení","obložení"],["souprava","souprava"],
    ["buben","buben"],["čelist","čelist"],["příslušenství","příslušenství"],
  ];
  for (const [mk, cv] of frags) { if (k.includes(mk)) { const m = cats.find(c => c.name.toLowerCase().includes(cv)); if (m) return m; }}
  return null;
}

// Hotspot positions on the brake-system.svg image (% based on 960x540)
interface Hotspot { id: string; label: string; match: string; x: number; y: number; }

const MAIN_HOTSPOTS: Hotspot[] = [
  // Front left — tarcza (disc)
  { id: "discL",      label: "Brzdový kotouč",         match: "brzdový kotouč",        x: 12, y: 36 },
  // Front left — klocki (pad) na tarczy
  { id: "padL",       label: "Brzdové obložení",       match: "brzdové obložení",      x: 20, y: 26 },
  // Caliper — zacisk
  { id: "caliper",    label: "Brzdový třmen",          match: "brzdový třmen",         x: 24, y: 18 },
  // Kotoučová brzda (GROUP) — na prawym kole górnym
  { id: "disc",       label: "Kotoučová brzda",        match: "kotoučová brzda",       x: 70, y: 22 },
  // Booster — środek
  { id: "booster",    label: "Posilovač brzd",         match: "posilovač brzd",        x: 56, y: 38 },
  // Master cylinder — centralny blok
  { id: "master",     label: "Hlavní brzd. válec",     match: "hlavní brzdový válec",  x: 42, y: 38 },
  // Reservoir
  { id: "reservoir",  label: "Nádrž kapaliny",         match: "nádrž",                 x: 37, y: 12 },
  // Fluid
  { id: "fluid",      label: "Brzdová kapalina",       match: "brzdová kapalina",      x: 42, y: 10 },
  // Switch
  { id: "switch",     label: "Spínač brzd. světla",    match: "spínač brzdového světla", x: 34, y: 44 },
  // Drum brake — dolne lewe koło
  { id: "drum",       label: "Bubnová brzda",          match: "bubnová brzda",         x: 40, y: 76 },
  // Wheel cylinder
  { id: "wcyl",       label: "Brzdový váleček",        match: "brzdový váleček",       x: 36, y: 68 },
  // Flex hoses
  { id: "hoses",      label: "Brzdové hadičky",        match: "brzdové hadičky",       x: 22, y: 56 },
  // Rigid pipes
  { id: "pipes",      label: "Brzdové potrubí",        match: "brzdové potrubí",       x: 50, y: 48 },
  // Regulator
  { id: "regulator",  label: "Regulátor brzd. síly",   match: "regulátor brzdné síly", x: 68, y: 44 },
  // Parking brake
  { id: "parking",    label: "Parkovací brzda",        match: "parkovací brzda",       x: 84, y: 28 },
  // Filter
  { id: "filter",     label: "Filtr",                  match: "filtr",                 x: 60, y: 54 },
];

export default function BrakeSchematic({ categories, onSelect, engineId, hoveredCategoryId }: Props) {
  const [hov, setHov] = useState<string | null>(null);

  // Map external hoveredCategoryId to internal hotspot id
  const externalHov = (() => {
    if (!hoveredCategoryId) return null;
    // Find which hotspot matches this category
    for (const hs of MAIN_HOTSPOTS) {
      const cat = findCat(hs.match, [...categories]);
      if (cat && cat.nodeId === hoveredCategoryId) return hs.id;
    }
    return null;
  })();

  const activeHov = hov || externalHov;
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const [subcats, setSubcats] = useState<Category[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [promotedSubcats, setPromotedSubcats] = useState<Category[]>([]);

  // Auto-load subcats of "Kotoučová brzda" to promote Brzdový kotouč + Brzdové obložení to main level
  useEffect(() => {
    if (!engineId) return;
    const discGroup = categories.find(c => c.name.toLowerCase().includes("kotoučová"));
    if (!discGroup || discGroup.isEndNode) return;
    fetch(`/api/vehicles?action=categories&engineId=${engineId}&parentId=${discGroup.nodeId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPromotedSubcats(d); })
      .catch(() => {});
  }, [engineId, categories]);

  // Load subcategories when drilldown changes
  useEffect(() => {
    if (!drilldown || !engineId) { setSubcats([]); return; }
    setLoadingSub(true);
    fetch(`/api/vehicles?action=categories&engineId=${engineId}&parentId=${drilldown}`)
      .then(r => r.json())
      .then(d => setSubcats(Array.isArray(d) ? d : []))
      .catch(() => setSubcats([]))
      .finally(() => setLoadingSub(false));
  }, [drilldown, engineId]);

  // Merge promoted subcats with main categories for matching
  const allCats = [...categories, ...promotedSubcats];
  const activeParts = MAIN_HOTSPOTS.filter(p => findCat(p.match, allCats));

  function handleHotspotClick(hs: Hotspot) {
    const cat = findCat(hs.match, allCats);
    if (!cat) return;
    if (cat.isEndNode) {
      onSelect({ ...cat, href: "" });
    } else {
      // GROUP — show subcats
      setDrilldown(prev => prev === cat.nodeId ? null : cat.nodeId);
    }
  }

  const drilldownName = drilldown ? categories.find(c => c.nodeId === drilldown)?.name : null;

  return (
    <div className="flex flex-col">
      {/* Schematic image with overlay hotspots */}
      <div className="relative w-full" style={{ aspectRatio: "960/540" }}>
        {/* Background SVG image */}
        <img
          src="/schematics/brake-system.svg"
          alt="Brzdový systém"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        {/* Hotspot overlays */}
        {activeParts.map(hs => {
          const on = activeHov === hs.id;
          const isExpanded = drilldown === findCat(hs.match, allCats)?.nodeId;
          return (
            <button
              key={hs.id}
              className="absolute group"
              style={{ left: `${hs.x}%`, top: `${hs.y}%`, transform: "translate(-50%, -50%)", zIndex: on ? 50 : 10 }}
              onMouseEnter={() => setHov(hs.id)}
              onMouseLeave={() => setHov(null)}
              onClick={() => handleHotspotClick(hs)}
            >
              {/* Pulse ring */}
              {!on && !isExpanded && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-primary/20 animate-ping" />
                </span>
              )}
              {/* Dot */}
              <span className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                on || isExpanded
                  ? "w-5 h-5 bg-primary border-primary shadow-lg shadow-primary/30"
                  : "w-3.5 h-3.5 bg-white border-primary"
              }`} />
              {/* Tooltip — always above dot */}
              {on && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap z-50 pointer-events-none shadow-lg">
                  {hs.label}
                  {!findCat(hs.match, allCats)?.isEndNode && " ▸"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategories panel (when GROUP is clicked) */}
      {drilldown && drilldownName && (
        <div className="mt-2 bg-primary/5 rounded-lg p-2.5 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-primary flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              {drilldownName}
            </p>
            <button onClick={() => setDrilldown(null)} className="text-[10px] text-mltext-light hover:text-primary">✕</button>
          </div>
          {loadingSub ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-mlborder border-t-primary" />
              <span className="text-[10px] text-mltext-light">Načítám...</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {subcats.map(sub => (
                <button
                  key={sub.nodeId}
                  onClick={() => onSelect({ ...sub, href: "" })}
                  className="w-full text-left px-2.5 py-1.5 rounded text-[11px] font-semibold text-mltext hover:bg-white hover:text-primary hover:shadow-sm transition-all flex items-center justify-between"
                >
                  <span>{sub.name}</span>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-mltext-light/30" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Part list — synced with hover */}
      <div className="mt-2 grid grid-cols-2 gap-px">
        {activeParts.map(hs => {
          const on = activeHov === hs.id;
          const cat = findCat(hs.match, allCats);
          const isGroup = cat && !cat.isEndNode;
          const isExpanded = drilldown === cat?.nodeId;
          return (
            <button
              key={hs.id}
              onMouseEnter={() => setHov(hs.id)}
              onMouseLeave={() => setHov(null)}
              onClick={() => handleHotspotClick(hs)}
              className={`text-left px-2 py-1.5 text-[10px] font-semibold transition-all flex items-center gap-1.5 rounded ${
                on || isExpanded ? "bg-primary/10 text-primary" : "text-mltext hover:bg-gray-50"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${on || isExpanded ? "bg-primary" : "bg-gray-300"}`} />
              <span className="truncate">{hs.label}</span>
              {isGroup && (
                <svg viewBox="0 0 24 24" className={`w-2.5 h-2.5 ml-auto shrink-0 transition-transform ${isExpanded ? "rotate-90 text-primary" : "text-mltext-light/30"}`} fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              )}
              {!isGroup && on && (
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 ml-auto shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
