"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BrandItem { name: string; slug: string; brandId: number; }
interface ModelItem { name: string; slug: string; modelId: number; years: string; }
interface EngineItem { name: string; slug: string; engineId: number; power: string; years: string; engineCode: string; }

export default function VehicleSelector() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<EngineItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles?action=brands").then((r) => r.json()).then((d) => setBrands(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBrand) { setModels([]); setSelectedModel(null); return; }
    setLoading(true); setModels([]); setSelectedModel(null); setEngines([]); setSelectedEngine(null);
    fetch(`/api/vehicles?action=models&brandId=${selectedBrand.brandId}`).then((r) => r.json()).then((d) => setModels(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [selectedBrand]);

  useEffect(() => {
    if (!selectedModel || !selectedBrand) { setEngines([]); setSelectedEngine(null); return; }
    setLoading(true); setEngines([]); setSelectedEngine(null);
    fetch(`/api/vehicles?action=engines&brandId=${selectedBrand.brandId}&modelId=${selectedModel.modelId}`).then((r) => r.json()).then((d) => setEngines(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [selectedBrand, selectedModel]);

  const handleSearch = () => {
    if (!selectedEngine || !selectedBrand || !selectedModel) return;
    const params = new URLSearchParams({
      bs: selectedBrand.slug, ms: selectedModel.slug, es: selectedEngine.slug || slugify(selectedEngine.name),
      bi: String(selectedBrand.brandId), mi: String(selectedModel.modelId),
      bn: selectedBrand.name, mn: selectedModel.name, en: `${selectedEngine.name} ${selectedEngine.power}`,
    });
    router.push(`/vehicle/${selectedEngine.engineId}?${params}`);
  };

  const canSubmit = !!selectedEngine;
  const selectClass = "w-full bg-white/[0.06] border-2 border-white/[0.08] hover:border-white/[0.15] rounded-xl h-12 px-4 text-sm font-semibold text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-30 appearance-none cursor-pointer";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3">
      <div>
        <label className="block text-primary-light text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-wider">1. Značka</label>
        <select value={selectedBrand?.brandId ?? ""} onChange={(e) => setSelectedBrand(brands.find((b) => b.brandId === parseInt(e.target.value)) || null)} className={selectClass}>
          <option value="">Vyberte značku</option>
          {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-primary-light text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-wider">2. Model</label>
        <select value={selectedModel?.modelId ?? ""} onChange={(e) => setSelectedModel(models.find((m) => m.modelId === parseInt(e.target.value)) || null)} disabled={!selectedBrand || !models.length} className={selectClass}>
          <option value="">{loading && !models.length ? "Načítám..." : "Vyberte model"}</option>
          {models.map((m) => <option key={m.modelId} value={m.modelId}>{m.name} {m.years ? `(${m.years})` : ""}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-primary-light text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-wider">3. Motor</label>
        <select value={selectedEngine?.engineId ?? ""} onChange={(e) => setSelectedEngine(engines.find((en) => en.engineId === parseInt(e.target.value)) || null)} disabled={!selectedModel || !engines.length} className={selectClass}>
          <option value="">{loading && !engines.length ? "Načítám..." : "Vyberte motor"}</option>
          {engines.map((e) => <option key={e.engineId} value={e.engineId}>{e.name} {e.power} {e.engineCode ? `(${e.engineCode})` : ""}</option>)}
        </select>
      </div>
      <div className="flex items-end">
        <button
          onClick={handleSearch}
          disabled={!canSubmit}
          className={`w-full sm:w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
            canSubmit
              ? "bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 text-white hover:scale-105"
              : "bg-white/[0.06] text-white/20 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
