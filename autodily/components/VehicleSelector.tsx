"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";

interface BrandItem { name: string; slug: string; brandId: number; }
interface ModelItem { name: string; slug: string; modelId: number; years?: string; }
interface EngineItem {
  name: string; slug: string; engineId: number; power: string;
  years: string; engineCode: string; fuel: string;
}

type Step = "brand" | "model" | "engine";

export default function VehicleSelector() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brand");
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);

  // Load brands
  useEffect(() => {
    fetch("/api/vehicles?action=brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Filter input focus on step change
  useEffect(() => {
    setFilter("");
    setTimeout(() => filterRef.current?.focus(), 100);
  }, [step]);

  function selectBrand(brand: BrandItem) {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setModels([]);
    setEngines([]);
    setStep("model");
    setLoading(true);
    fetch(`/api/vehicles?action=models&brandId=${brand.brandId}`)
      .then((r) => r.json())
      .then((d) => setModels(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function selectModel(model: ModelItem) {
    if (!selectedBrand) return;
    setSelectedModel(model);
    setEngines([]);
    setStep("engine");
    setLoading(true);
    fetch(`/api/vehicles?action=engines&brandId=${selectedBrand.brandId}&modelId=${model.modelId}`)
      .then((r) => r.json())
      .then((d) => setEngines(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function selectEngine(engine: EngineItem) {
    if (!selectedBrand || !selectedModel) return;
    const params = new URLSearchParams({
      bs: selectedBrand.slug, ms: selectedModel.slug, es: engine.slug || slugify(engine.name),
      bi: String(selectedBrand.brandId), mi: String(selectedModel.modelId),
      bn: selectedBrand.name, mn: selectedModel.name, en: `${engine.name} ${engine.power}`,
    });
    router.push(`/vehicle/${engine.engineId}?${params}`);
  }

  function goBack() {
    setFilter("");
    if (step === "engine") { setStep("model"); setEngines([]); }
    else if (step === "model") { setStep("brand"); setModels([]); setSelectedBrand(null); }
  }

  const lowerFilter = filter.toLowerCase();

  // ─── BRAND STEP ─────────────────────
  if (step === "brand") {
    const filtered = filter
      ? brands.filter((b) => b.name.toLowerCase().includes(lowerFilter))
      : brands;

    return (
      <div>
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Hledat značku..."
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl h-11 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-2">
          {filtered.map((brand) => {
            const logoUrl = getCarBrandLogoUrl(brand.slug) || getCarBrandLogoUrl(brand.name);
            return (
              <button
                key={brand.brandId}
                onClick={() => selectBrand(brand)}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy" />
                  ) : (
                    <span className="text-[11px] font-bold text-white/40 uppercase">{brand.name.slice(0, 3)}</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-white/50 group-hover:text-white/80 uppercase tracking-wider truncate w-full text-center transition-colors">
                  {brand.name}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <p className="text-center text-white/30 text-sm py-6">Značka nenalezena</p>
        )}
      </div>
    );
  }

  // ─── MODEL STEP ─────────────────────
  if (step === "model") {
    const filtered = filter
      ? models.filter((m) => m.name.toLowerCase().includes(lowerFilter))
      : models;

    return (
      <div>
        {/* Header with back + brand info */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 hover:text-white transition-all">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          {selectedBrand && (
            <>
              {getCarBrandLogoUrl(selectedBrand.slug) && (
                <img src={getCarBrandLogoUrl(selectedBrand.slug)} alt="" className="w-7 h-7 object-contain" />
              )}
              <span className="text-white font-bold text-sm">{selectedBrand.name}</span>
            </>
          )}
          <span className="text-white/20 text-xs">→ vyberte model</span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Hledat model..."
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl h-11 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/10 border-t-primary" />
          </div>
        )}

        {/* Model list with car photos */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {filtered.map((model) => (
              <button
                key={model.modelId}
                onClick={() => selectModel(model)}
                className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all text-left"
              >
                {/* Car photo thumbnail */}
                <div className="w-14 h-10 rounded-lg bg-white/[0.04] overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={`/api/tecdoc-image?type=car&id=${model.modelId}`}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-white/80 group-hover:text-white truncate transition-colors">
                    {model.name}
                  </span>
                  {model.years && (
                    <span className="text-[11px] text-white/30">{model.years}</span>
                  )}
                </div>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/10 group-hover:text-white/30 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-white/30 text-sm py-6">Model nenalezen</p>
        )}
      </div>
    );
  }

  // ─── ENGINE STEP ────────────────────
  const filtered = filter
    ? engines.filter((e) => `${e.name} ${e.power} ${e.fuel} ${e.engineCode}`.toLowerCase().includes(lowerFilter))
    : engines;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 hover:text-white transition-all">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {selectedBrand && getCarBrandLogoUrl(selectedBrand.slug) && (
          <img src={getCarBrandLogoUrl(selectedBrand.slug)} alt="" className="w-6 h-6 object-contain" />
        )}
        <span className="text-white/60 text-sm font-semibold">{selectedBrand?.name}</span>
        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        <span className="text-white font-bold text-sm">{selectedModel?.name}</span>
        <span className="text-white/20 text-xs">→ vyberte motor</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          ref={filterRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Hledat motor..."
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl h-11 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/10 border-t-primary" />
        </div>
      )}

      {/* Engine list */}
      {!loading && (
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {filtered.map((engine) => (
            <button
              key={engine.engineId}
              onClick={() => selectEngine(engine)}
              className="group w-full flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.1] hover:border-primary/30 transition-all text-left"
            >
              {/* Engine icon */}
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 4v4h10V4M5 8h14v4H5zM9 12v8M15 12v8M7 16h10" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <span className="block text-[14px] font-bold text-white/80 group-hover:text-white transition-colors">
                  {engine.name}
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {engine.power && (
                    <span className="text-[11px] text-primary font-bold">{engine.power}</span>
                  )}
                  {engine.fuel && (
                    <span className="text-[11px] text-white/30">{engine.fuel}</span>
                  )}
                  {engine.years && (
                    <span className="text-[11px] text-white/30">{engine.years}</span>
                  )}
                  {engine.engineCode && (
                    <span className="text-[11px] text-white/20 font-mono">{engine.engineCode}</span>
                  )}
                </div>
              </div>

              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/10 group-hover:text-primary shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-white/30 text-sm py-6">Motor nenalezen</p>
      )}
    </div>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
