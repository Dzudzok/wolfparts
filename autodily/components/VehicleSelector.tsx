"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BrandItem {
  name: string;
  slug: string;
  brandId: number;
}

interface ModelItem {
  name: string;
  slug: string;
  modelId: number;
  years: string;
}

interface EngineItem {
  name: string;
  slug: string;
  engineId: number;
  power: string;
  years: string;
  engineCode: string;
}

export default function VehicleSelector() {
  const router = useRouter();

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [engines, setEngines] = useState<EngineItem[]>([]);

  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<EngineItem | null>(null);

  const [loading, setLoading] = useState(false);

  // Load brands on mount
  useEffect(() => {
    fetch("/api/vehicles?action=brands")
      .then((r) => r.json())
      .then((data: BrandItem[]) => setBrands(data))
      .catch(() => {});
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel(null);
      return;
    }
    setLoading(true);
    setModels([]);
    setSelectedModel(null);
    setEngines([]);
    setSelectedEngine(null);
    fetch(`/api/vehicles?action=models&brandId=${selectedBrand.brandId}`)
      .then((r) => r.json())
      .then((data: ModelItem[]) => setModels(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedBrand]);

  // Load engines when model changes
  useEffect(() => {
    if (!selectedModel || !selectedBrand) {
      setEngines([]);
      setSelectedEngine(null);
      return;
    }
    setLoading(true);
    setEngines([]);
    setSelectedEngine(null);
    fetch(`/api/vehicles?action=engines&brandId=${selectedBrand.brandId}&modelId=${selectedModel.modelId}`)
      .then((r) => r.json())
      .then((data: EngineItem[]) => setEngines(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedBrand, selectedModel]);

  const handleSearch = () => {
    if (!selectedEngine || !selectedBrand || !selectedModel) return;
    const params = new URLSearchParams({
      bs: selectedBrand.slug,
      ms: selectedModel.slug,
      es: selectedEngine.slug || slugify(selectedEngine.name),
      bi: String(selectedBrand.brandId),
      mi: String(selectedModel.modelId),
      bn: selectedBrand.name,
      mn: selectedModel.name,
      en: `${selectedEngine.name} ${selectedEngine.power}`,
    });
    router.push(`/vehicle/${selectedEngine.engineId}?${params}`);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Brand */}
        <select
          value={selectedBrand?.brandId ?? ""}
          onChange={(e) => {
            const b = brands.find((b) => b.brandId === parseInt(e.target.value));
            setSelectedBrand(b || null);
          }}
          className="flex-1 border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Vyber znacku</option>
          {brands.map((b) => (
            <option key={b.brandId} value={b.brandId}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Model */}
        <select
          value={selectedModel?.modelId ?? ""}
          onChange={(e) => {
            const m = models.find((m) => m.modelId === parseInt(e.target.value));
            setSelectedModel(m || null);
          }}
          disabled={!selectedBrand || models.length === 0}
          className="flex-1 border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
        >
          <option value="">{loading && !models.length ? "Nacitam..." : "Vyber model"}</option>
          {models.map((m) => (
            <option key={m.modelId} value={m.modelId}>
              {m.name} {m.years ? `(${m.years})` : ""}
            </option>
          ))}
        </select>

        {/* Engine */}
        <select
          value={selectedEngine?.engineId ?? ""}
          onChange={(e) => {
            const en = engines.find((en) => en.engineId === parseInt(e.target.value));
            setSelectedEngine(en || null);
          }}
          disabled={!selectedModel || engines.length === 0}
          className="flex-1 border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
        >
          <option value="">{loading && !engines.length ? "Nacitam..." : "Vyber motor"}</option>
          {engines.map((e) => (
            <option key={e.engineId} value={e.engineId}>
              {e.name} {e.power} {e.engineCode ? `(${e.engineCode})` : ""} {e.years ? `— ${e.years}` : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSearch}
        disabled={!selectedEngine}
        className="mt-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        Hledat dily pro vozidlo
      </button>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
