"use client";

import { useState, useEffect, useRef, useMemo, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";

/* ─── Tiny car thumbnail with localStorage cache ─── */
const engineIdCache: Record<number, number | null> = {};
const IMG_CACHE_PREFIX = "wp_car_";

function getImgFromStorage(engineId: number): string | null {
  try { return localStorage.getItem(IMG_CACHE_PREFIX + engineId); } catch { return null; }
}

function saveImgToStorage(engineId: number, dataUrl: string) {
  try { localStorage.setItem(IMG_CACHE_PREFIX + engineId, dataUrl); } catch { /* quota */ }
}

const CarSilhouette = () => (
  <svg viewBox="0 0 200 80" className="w-24 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 28c4-10 12-16 22-16h36c10 0 18 4 24 12l20 12c8 2 14 6 16 12v8c0 4-3 7-7 7h-10a14 14 0 1 1-28 0H67a14 14 0 1 1-28 0H27c-4 0-7-3-7-7v-6c0-6 4-10 10-12l30-10z" stroke="#cbd5e1" strokeWidth="2"/>
    <line x1="82" y1="12" x2="82" y2="36" stroke="#cbd5e1" strokeWidth="1.5" opacity=".6"/>
    <line x1="118" y1="16" x2="130" y2="36" stroke="#cbd5e1" strokeWidth="1.5" opacity=".6"/>
    <circle cx="53" cy="63" r="9" stroke="#cbd5e1" strokeWidth="2.5"/>
    <circle cx="53" cy="63" r="3" fill="#cbd5e1" opacity=".4"/>
    <circle cx="147" cy="63" r="9" stroke="#cbd5e1" strokeWidth="2.5"/>
    <circle cx="147" cy="63" r="3" fill="#cbd5e1" opacity=".4"/>
  </svg>
);

function ModelCardImage({ modelId, brandId, modelName }: { modelId: number; brandId: number; modelName?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Resolve engineId for this model
      let eid = engineIdCache[modelId] ?? null;
      if (engineIdCache[modelId] === undefined) {
        try {
          const r = await fetch(`/api/vehicles?action=engines&brandId=${brandId}&modelId=${modelId}`);
          const d = await r.json();
          eid = Array.isArray(d) && d[0]?.engineId ? d[0].engineId : null;
        } catch { eid = null; }
        engineIdCache[modelId] = eid;
      }
      if (!eid || cancelled) return;

      // 2. Check localStorage cache
      const cached = getImgFromStorage(eid);
      if (cached) { if (!cancelled) setSrc(cached); return; }

      // 3. Fetch and cache as data URL
      try {
        const res = await fetch(`/api/tecdoc-image?type=car&id=${eid}`);
        if (!res.ok) { if (!cancelled) setHidden(true); return; }
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          saveImgToStorage(eid!, dataUrl);
          if (!cancelled) setSrc(dataUrl);
        };
        reader.readAsDataURL(blob);
      } catch { if (!cancelled) setHidden(true); }
    }

    load();
    return () => { cancelled = true; };
  }, [modelId, brandId]);

  if (hidden) return (
    <div className="w-full h-full bg-white rounded flex flex-col items-center justify-center">
      <CarSilhouette />
      {modelName && <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">{modelName}</span>}
    </div>
  );
  if (!src) return <div className="w-full h-full bg-white rounded animate-pulse" />;

  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-contain"
    />
  );
}

interface BrandItem { name: string; slug: string; brandId: number; }
interface ModelItem { name: string; slug: string; modelId: number; years?: string; }
interface EngineItem {
  name: string; slug: string; engineId: number; power: string;
  years: string; engineCode: string; fuel: string;
}

type Step = "brand" | "model" | "engine";

export default function VehiclePickerModal({ onClose, initialBrandName }: { onClose: () => void; initialBrandName?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brand");
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Filters
  const [fuelFilter, setFuelFilter] = useState<string>("");
  const [yearRange, setYearRange] = useState(2000);
  const [hoveredEngine, setHoveredEngine] = useState<EngineItem | null>(null);
  const [hoveredModel, setHoveredModel] = useState<ModelItem | null>(null);
  const [modelPreviewCarId, setModelPreviewCarId] = useState<number | null>(null);

  const [allBrandsLoaded, setAllBrandsLoaded] = useState(false);

  // Start with hardcoded popular brands — ZERO API calls on open
  const POPULAR_BRANDS: BrandItem[] = [
    { name: "ALFA ROMEO", slug: "alfa-romeo", brandId: 2 },
    { name: "AUDI", slug: "audi", brandId: 5 },
    { name: "BMW", slug: "bmw", brandId: 16 },
    { name: "CITROËN", slug: "citroen", brandId: 21 },
    { name: "DACIA", slug: "dacia", brandId: 1523 },
    { name: "FIAT", slug: "fiat", brandId: 35 },
    { name: "FORD", slug: "ford", brandId: 36 },
    { name: "HONDA", slug: "honda", brandId: 45 },
    { name: "HYUNDAI", slug: "hyundai", brandId: 183 },
    { name: "KIA", slug: "kia", brandId: 184 },
    { name: "MAZDA", slug: "mazda", brandId: 72 },
    { name: "MERCEDES-BENZ", slug: "mercedes-benz", brandId: 74 },
    { name: "NISSAN", slug: "nissan", brandId: 80 },
    { name: "OPEL", slug: "opel", brandId: 84 },
    { name: "PEUGEOT", slug: "peugeot", brandId: 88 },
    { name: "RENAULT", slug: "renault", brandId: 93 },
    { name: "SEAT", slug: "seat", brandId: 104 },
    { name: "SKODA", slug: "skoda", brandId: 106 },
    { name: "SUZUKI", slug: "suzuki", brandId: 109 },
    { name: "TOYOTA", slug: "toyota", brandId: 111 },
    { name: "VOLVO", slug: "volvo", brandId: 120 },
    { name: "VW", slug: "vw", brandId: 121 },
  ];

  useEffect(() => {
    setBrands(POPULAR_BRANDS);
    setLoading(false);

    // If initial brand passed, auto-select it
    if (initialBrandName) {
      const match = POPULAR_BRANDS.find((b) => b.name.toUpperCase() === initialBrandName.toUpperCase());
      if (match) {
        selectBrandDirect(match);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectBrandDirect(brand: BrandItem) {
    setSelectedBrand(brand); setSelectedModel(null); setModels([]); setEngines([]);
    setStep("model"); setLoading(true);
    fetch(`/api/vehicles?action=models&brandId=${brand.brandId}`)
      .then((r) => r.json()).then((d) => setModels(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }

  // Fetch car photo for hovered model (get first engine ID)
  const modelCarIdCache = useRef<Record<number, number>>({});
  function handleModelHover(model: ModelItem) {
    setHoveredModel(model);
    if (modelCarIdCache.current[model.modelId]) {
      setModelPreviewCarId(modelCarIdCache.current[model.modelId]);
      return;
    }
    if (!selectedBrand) return;
    fetch(`/api/vehicles?action=engines&brandId=${selectedBrand.brandId}&modelId=${model.modelId}`)
      .then((r) => r.json())
      .then((d) => {
        const engines = Array.isArray(d) ? d : [];
        if (engines[0]?.engineId) {
          modelCarIdCache.current[model.modelId] = engines[0].engineId;
          setModelPreviewCarId(engines[0].engineId);
        }
      })
      .catch(() => {});
  }

  // When searching and no match in favoured brands → load ALL brands from TecDoc
  useEffect(() => {
    if (step !== "brand" || !search || search.length < 2 || allBrandsLoaded) return;
    const hasMatch = brands.some((b) => b.name.toLowerCase().includes(search.toLowerCase()));
    if (hasMatch) return;
    // No match — fetch all brands
    fetch("/api/vehicles?action=brands&all=1")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d.length > brands.length) { setBrands(d); setAllBrandsLoaded(true); } })
      .catch(() => {});
  }, [search, step, brands, allBrandsLoaded]);

  useEffect(() => {
    setSearch(""); setFuelFilter(""); setYearRange(2000);
    setTimeout(() => searchRef.current?.focus(), 150);
  }, [step]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function selectBrand(brand: BrandItem) {
    setSelectedBrand(brand); setSelectedModel(null); setModels([]); setEngines([]);
    setStep("model"); setLoading(true);
    fetch(`/api/vehicles?action=models&brandId=${brand.brandId}`)
      .then((r) => r.json()).then((d) => setModels(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }

  function selectModel(model: ModelItem) {
    if (!selectedBrand) return;
    setSelectedModel(model); setEngines([]); setStep("engine"); setLoading(true);
    fetch(`/api/vehicles?action=engines&brandId=${selectedBrand.brandId}&modelId=${model.modelId}`)
      .then((r) => r.json()).then((d) => setEngines(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }

  function selectEngine(engine: EngineItem) {
    if (!selectedBrand || !selectedModel) return;
    const params = new URLSearchParams({
      bs: selectedBrand.slug, ms: selectedModel.slug, es: engine.slug || slugify(engine.name),
      bi: String(selectedBrand.brandId), mi: String(selectedModel.modelId),
      bn: selectedBrand.name, mn: selectedModel.name, en: `${engine.name} ${engine.power}`,
    });
    // Prefetch categories before closing modal for smoother transition
    const url = `/vehicle/${engine.engineId}?${params}`;
    router.prefetch(url);
    onClose();
    router.push(url);
  }

  function goBack() {
    setSearch(""); setHoveredEngine(null); setHoveredModel(null); setModelPreviewCarId(null);
    if (step === "engine") { setStep("model"); setEngines([]); }
    else if (step === "model") { setStep("brand"); setModels([]); setSelectedBrand(null); }
  }

  const lf = search.toLowerCase();

  function parseYear(s: string): { from: number; to: number } {
    const m = s.match(/(\d{2})\.(\d{4})/g) || [];
    const from = m[0] ? parseInt(m[0].split(".")[1]) : 0;
    const to = m[1] ? parseInt(m[1].split(".")[1]) : 2999;
    return { from, to };
  }

  const fuelTypes = useMemo(() => {
    const set = new Set<string>();
    engines.forEach((e) => { if (e.fuel) set.add(e.fuel); });
    return [...set].sort();
  }, [engines]);

  // Group models by base name (e.g. "A3", "GOLF", "OCTAVIA")
  interface ModelGroup { baseName: string; models: ModelItem[]; }

  const modelGroups = useMemo((): ModelGroup[] => {
    // Extract base model name: "Q5 (8RB)" → "Q5", "Q5 Sportback (FYT)" → "Q5"
    // "GOLF VII (5G1)" → "GOLF", "100 C3 Avant (445, 446)" → "100"
    function getBaseName(name: string): string {
      // Remove everything in parentheses
      const clean = name.replace(/\s*\([^)]*\)/g, "").trim();
      const parts = clean.split(/\s+/);
      // First part is always the base: "Q5", "GOLF", "A3", "100", "OCTAVIA"
      let base = parts[0];
      // If second part is a number like "C3", "C4" — include it (Audi 100 C3, 80 B2)
      if (parts[1] && /^[A-Z]\d/.test(parts[1])) {
        // skip — it's a generation code, not part of base name
      }
      return base;
    }

    const groups = new Map<string, ModelItem[]>();
    const filtered = models.filter((m) => {
      if (search && !m.name.toLowerCase().includes(lf)) return false;
      if (yearRange > 1970) {
        const y = parseYear(m.years || "");
        if (y.to < yearRange) return false;
      }
      return true;
    });

    for (const model of filtered) {
      const base = getBaseName(model.name);
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(model);
    }

    return [...groups.entries()]
      .map(([baseName, models]) => ({ baseName, models }))
      .sort((a, b) => a.baseName.localeCompare(b.baseName));
  }, [models, search, lf, yearRange]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (search && !m.name.toLowerCase().includes(lf)) return false;
      if (yearRange > 1970) {
        const y = parseYear(m.years || "");
        if (y.to < yearRange) return false;
      }
      return true;
    });
  }, [models, search, lf, yearRange]);

  const filteredEngines = useMemo(() => {
    return engines.filter((e) => {
      if (search && !`${e.name} ${e.power} ${e.fuel} ${e.engineCode}`.toLowerCase().includes(lf)) return false;
      if (fuelFilter && e.fuel !== fuelFilter) return false;
      if (yearRange > 1970) {
        const y = parseYear(e.years);
        if (y.to < yearRange) return false;
      }
      return true;
    });
  }, [engines, search, lf, fuelFilter, yearRange]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => !search || b.name.toLowerCase().includes(lf));
  }, [brands, search, lf]);

  const stepNum = step === "brand" ? 1 : step === "model" ? 2 : 3;
  const showSidebar = (step === "engine" || step === "model") && !loading;

  // Fuel icons
  function FuelIcon({ type }: { type: string }) {
    const lower = type.toLowerCase();
    if (lower.includes("benz")) return <span className="text-[10px] font-black text-green-600">PB</span>;
    if (lower.includes("naft") || lower.includes("diesel")) return <span className="text-[10px] font-black text-amber-700">ON</span>;
    if (lower.includes("cng") || lower.includes("lpg")) return <span className="text-[10px] font-black text-blue-600">CNG</span>;
    if (lower.includes("elekt") || lower.includes("hybrid")) return <span className="text-[10px] font-black text-emerald-500">EV</span>;
    return <span className="text-[10px] font-black text-gray-400">?</span>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[1100px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: "min(92vh, 780px)" }}>

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            {step !== "brand" && (
              <button onClick={goBack} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-mltext-light hover:text-mltext-dark transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <div className="flex items-center gap-2 text-sm">
              {selectedBrand && getCarBrandLogoUrl(selectedBrand.slug) && (
                <img src={getCarBrandLogoUrl(selectedBrand.slug)} alt="" className="w-6 h-6 object-contain" />
              )}
              {!selectedBrand && <span className="text-mltext-dark font-bold text-[15px]">Vyberte vozidlo</span>}
              {selectedBrand && <span className={selectedModel ? "text-mltext-light text-[13px]" : "text-mltext-dark font-bold"}>{selectedBrand.name}</span>}
              {selectedModel && (
                <>
                  <span className="text-mltext-light/30">›</span>
                  <span className="text-mltext-dark font-bold">{selectedModel.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-mltext-light mr-2">
              <span className={stepNum >= 1 ? "text-primary" : ""}>Značka</span>
              <span className="text-mltext-light/20">→</span>
              <span className={stepNum >= 2 ? "text-primary" : ""}>Model</span>
              <span className="text-mltext-light/20">→</span>
              <span className={stepNum >= 3 ? "text-primary" : ""}>Motor</span>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-1 rounded-full transition-all ${n <= stepNum ? "w-8 bg-primary" : "w-3 bg-gray-200"}`} />
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-mltext-light hover:text-mltext-dark transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ─── LEFT SIDEBAR FILTERS ─── */}
          {showSidebar && (
            <div className="hidden sm:flex flex-col w-60 border-r border-gray-100 shrink-0 bg-gray-50/50">
              <div className="flex-1 overflow-y-auto p-4">

                {/* Year slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-bold text-mltext">Rok výroby</p>
                    <span className="text-[12px] font-bold text-primary">
                      {yearRange > 1970 ? `od ${yearRange}` : "Vše"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1970" max="2026" step="1"
                    value={yearRange}
                    onChange={(e) => setYearRange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-mltext-light">1970</span>
                    <span className="text-[10px] text-mltext-light">2026</span>
                  </div>
                  {/* Quick buttons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[{ label: "Vše", val: 1970 }, { label: "2020+", val: 2020 }, { label: "2015+", val: 2015 }, { label: "2010+", val: 2010 }, { label: "2005+", val: 2005 }, { label: "2000+", val: 2000 }].map((b) => (
                      <button
                        key={b.val}
                        onClick={() => setYearRange(b.val)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${yearRange === b.val ? "bg-primary text-white border-primary" : "bg-white text-mltext-light border-gray-200 hover:border-primary/30"}`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fuel filter — engines only */}
                {step === "engine" && fuelTypes.length > 1 && (
                  <div className="mb-6">
                    <p className="text-[12px] font-bold text-mltext mb-2.5">Palivo</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setFuelFilter("")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${!fuelFilter ? "bg-primary/5 border-primary/20 text-primary" : "bg-white border-gray-200 text-mltext hover:border-gray-300"}`}
                      >
                        <span className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-black text-mltext-light">VŠE</span>
                        <span className="text-[12px] font-semibold">Všechna paliva</span>
                      </button>
                      {fuelTypes.map((f) => {
                        const active = fuelFilter === f;
                        return (
                          <button
                            key={f}
                            onClick={() => setFuelFilter(active ? "" : f)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${active ? "bg-primary/5 border-primary/20" : "bg-white border-gray-200 hover:border-gray-300"}`}
                          >
                            <span className={`w-7 h-7 rounded-md flex items-center justify-center ${active ? "bg-primary/10" : "bg-gray-100"}`}>
                              <FuelIcon type={f} />
                            </span>
                            <span className={`text-[12px] font-semibold ${active ? "text-primary" : "text-mltext"}`}>{f}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hovered preview — engine or model */}
                {step === "engine" && hoveredEngine && (
                  <div className="p-3 bg-white rounded-xl border border-primary/20 shadow-sm">
                    <div className="w-full aspect-video rounded-lg bg-gray-50 overflow-hidden mb-2">
                      <img
                        src={`/api/tecdoc-image?type=car&id=${hoveredEngine.engineId}`}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <p className="text-[12px] text-mltext-light">{selectedBrand?.name} {selectedModel?.name}</p>
                    <p className="text-[13px] font-bold text-primary">{hoveredEngine.name}</p>
                    <div className="mt-1.5 space-y-0.5 text-[11px]">
                      {hoveredEngine.power && <div className="flex justify-between"><span className="text-mltext-light">Výkon</span><span className="font-bold text-mltext-dark">{hoveredEngine.power}</span></div>}
                      {hoveredEngine.fuel && <div className="flex justify-between"><span className="text-mltext-light">Palivo</span><span className="font-bold text-mltext-dark">{hoveredEngine.fuel}</span></div>}
                      {hoveredEngine.years && <div className="flex justify-between"><span className="text-mltext-light">Období</span><span className="font-bold text-mltext-dark">{hoveredEngine.years}</span></div>}
                    </div>
                  </div>
                )}

                {step === "model" && hoveredModel && modelPreviewCarId && (
                  <div className="p-3 bg-white rounded-xl border border-primary/20 shadow-sm">
                    <div className="w-full aspect-video rounded-lg bg-gray-50 overflow-hidden mb-2">
                      <img
                        src={`/api/tecdoc-image?type=car&id=${modelPreviewCarId}`}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <p className="text-[12px] text-mltext-light">{selectedBrand?.name}</p>
                    <p className="text-[13px] font-bold text-mltext-dark">{hoveredModel.name}</p>
                    {hoveredModel.years && <p className="text-[11px] text-mltext-light mt-0.5">{hoveredModel.years}</p>}
                  </div>
                )}
              </div>

              {/* Count bar */}
              <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
                <p className="text-[12px] text-mltext-light">
                  {step === "engine" ? (
                    <><span className="font-bold text-mltext-dark">{filteredEngines.length}</span> z {engines.length} motorů</>
                  ) : (
                    <><span className="font-bold text-mltext-dark">{filteredModels.length}</span> z {models.length} modelů</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ─── MAIN CONTENT ─── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-50 shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mltext-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={step === "brand" ? "Hledat značku..." : step === "model" ? "Hledat model..." : "Hledat motor, výkon..."}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl h-10 pl-9 pr-4 text-sm text-mltext-dark placeholder-mltext-light/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-primary mb-3" />
                  <span className="text-sm text-mltext-light">Načítám...</span>
                </div>
              )}

              {/* ─── BRANDS ─── */}
              {step === "brand" && !loading && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {filteredBrands.map((brand) => {
                    const logo = getCarBrandLogoUrl(brand.slug) || getCarBrandLogoUrl(brand.name);
                    return (
                      <button
                        key={brand.brandId}
                        onClick={() => selectBrand(brand)}
                        className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all bg-white"
                      >
                        <div className="w-14 h-14 flex items-center justify-center">
                          {logo ? (
                            <img src={logo} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy" />
                          ) : (
                            <span className="text-base font-bold text-mltext-light/30 uppercase">{brand.name.slice(0, 3)}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-mltext-light group-hover:text-primary uppercase tracking-wide truncate w-full text-center transition-colors">
                          {brand.name}
                        </span>
                      </button>
                    );
                  })}
                  {filteredBrands.length === 0 && <p className="col-span-full text-center text-mltext-light text-sm py-12">Značka nenalezena</p>}
                </div>
              )}

              {/* ─── MODELS (grouped) ─── */}
              {step === "model" && !loading && (
                <div>
                  {modelGroups.length === 0 && <p className="text-center text-mltext-light text-sm py-12">Model nenalezen</p>}

                  {/* If few groups or searching, show flat */}
                  {(search || modelGroups.length <= 8) ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {filteredModels.map((model) => (
                        <button
                          key={model.modelId}
                          onClick={() => selectModel(model)}
                          onMouseEnter={() => handleModelHover(model)}
                          onMouseLeave={() => { setHoveredModel(null); setModelPreviewCarId(null); }}
                          className="group flex flex-col p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/[0.02] hover:shadow-sm transition-all text-left bg-white"
                        >
                          <div className="w-full h-16 mb-2 rounded overflow-hidden bg-white">
                            {selectedBrand && <ModelCardImage modelId={model.modelId} brandId={selectedBrand.brandId} modelName={model.name} />}
                          </div>
                          <span className="block text-[13px] font-bold text-mltext-dark group-hover:text-primary truncate transition-colors">{model.name}</span>
                          {model.years && <span className="text-[11px] text-mltext-light block">{model.years}</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Grouped view — show base names as big buttons, expand on click */
                    <ModelGroupedView groups={modelGroups} onSelectModel={selectModel} onHoverModel={handleModelHover} onLeaveModel={() => { setHoveredModel(null); setModelPreviewCarId(null); }} brandId={selectedBrand?.brandId} />
                  )}
                </div>
              )}

              {/* ─── ENGINES ─── */}
              {step === "engine" && !loading && (
                <div className="space-y-1.5">
                  {filteredEngines.map((engine) => (
                    <button
                      key={engine.engineId}
                      onClick={() => selectEngine(engine)}
                      onMouseEnter={() => setHoveredEngine(engine)}
                      onMouseLeave={() => setHoveredEngine(null)}
                      className="group w-full flex items-center gap-5 px-5 py-4 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/[0.02] hover:shadow-sm transition-all text-left bg-white"
                    >
                      {/* Car photo */}
                      <div className="w-24 h-16 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 group-hover:border-primary/20 transition-colors">
                        <img
                          src={`/api/tecdoc-image?type=car&id=${engine.engineId}`}
                          alt=""
                          className="w-full h-full object-contain p-0.5"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-bold text-mltext-dark group-hover:text-primary transition-colors">
                            {engine.name}
                          </span>
                          {engine.power && (
                            <span className="text-[11px] font-bold text-white bg-primary rounded-md px-2 py-0.5">
                              {engine.power}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {engine.fuel && (
                            <span className="text-[11px] font-semibold text-mltext bg-gray-100 rounded-md px-2 py-0.5">{engine.fuel}</span>
                          )}
                          {engine.years && (
                            <span className="text-[11px] text-mltext-light">{engine.years}</span>
                          )}
                          {engine.engineCode && (
                            <span className="text-[11px] text-mltext-light/40 font-mono">{engine.engineCode}</span>
                          )}
                        </div>
                      </div>

                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-200 group-hover:text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  ))}
                  {filteredEngines.length === 0 && <p className="text-center text-mltext-light text-sm py-12">Žádný motor neodpovídá filtrům</p>}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Grouped model selector — expands inline under clicked group ─── */
interface ModelGroup { baseName: string; models: ModelItem[]; }

function ModelGroupedView({ groups, onSelectModel, onHoverModel, onLeaveModel, brandId }: { groups: ModelGroup[]; onSelectModel: (m: ModelItem) => void; onHoverModel?: (m: ModelItem) => void; onLeaveModel?: () => void; brandId?: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Arrange groups in a 4-col grid, but insert expanded panel spanning full width after the clicked row
  const cols = 4;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {groups.map((group, idx) => {
        const isExpanded = expanded === group.baseName;
        const yearRange = group.models.reduce(
          (acc, m) => {
            const parsed = m.years?.match(/(\d{4})/g) || [];
            const nums = parsed.map(Number);
            return {
              from: Math.min(acc.from, ...nums.filter(Boolean)),
              to: Math.max(acc.to, ...nums.filter(Boolean)),
            };
          },
          { from: 9999, to: 0 }
        );

        // Check if expanded panel should appear after this item (end of row or last in row)
        const isEndOfRow = (idx + 1) % cols === 0 || idx === groups.length - 1;
        const expandedGroupInThisRow = groups.slice(
          Math.floor(idx / cols) * cols,
          Math.floor(idx / cols) * cols + cols
        ).some((g) => expanded === g.baseName);
        const showExpanded = isEndOfRow && expandedGroupInThisRow;

        return (
          <Fragment key={group.baseName}>
            <button
              onClick={() => {
                if (group.models.length === 1) {
                  onSelectModel(group.models[0]);
                } else {
                  setExpanded(isExpanded ? null : group.baseName);
                }
              }}
              className={`group flex flex-col p-3 rounded-xl border text-left transition-all ${
                isExpanded
                  ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20"
                  : "border-gray-100 hover:border-primary/40 hover:shadow-sm bg-white"
              }`}
            >
              {brandId && (
                <div className="w-full h-16 mb-2 rounded overflow-hidden bg-white">
                  <ModelCardImage modelId={group.models[0].modelId} brandId={brandId} modelName={group.baseName} />
                </div>
              )}
              <span className={`text-[14px] font-bold transition-colors ${isExpanded ? "text-primary" : "text-mltext-dark group-hover:text-primary"}`}>
                {group.baseName}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-mltext-light">
                  {yearRange.from < 9999 ? `${yearRange.from} – ${yearRange.to || ""}` : ""}
                </span>
                {group.models.length > 1 && (
                  <span className="text-[10px] font-bold text-white bg-primary/70 rounded px-1.5 py-0.5">
                    {group.models.length}
                  </span>
                )}
              </div>
            </button>

            {/* Expanded sub-models — full width under this row */}
            {showExpanded && expanded && (
              <div className="col-span-full bg-gray-50 rounded-xl border border-gray-200 p-3 -mt-0.5">
                <p className="text-[11px] font-bold text-mltext-light uppercase tracking-wider mb-2 px-1">
                  {expanded} — vyberte generaci
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {groups.find((g) => g.baseName === expanded)?.models.map((model) => (
                    <button
                      key={model.modelId}
                      onClick={() => onSelectModel(model)}
                      onMouseEnter={() => onHoverModel?.(model)}
                      onMouseLeave={() => onLeaveModel?.()}
                      className="group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-white hover:shadow-sm transition-all text-left bg-white"
                    >
                      <div className="min-w-0">
                        <span className="block text-[13px] font-bold text-mltext-dark group-hover:text-primary truncate transition-colors">{model.name}</span>
                        {model.years && <span className="text-[11px] text-mltext-light">{model.years}</span>}
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-200 group-hover:text-primary shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
