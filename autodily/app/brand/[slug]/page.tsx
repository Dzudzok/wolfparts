"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";

interface BrandItem { name: string; slug: string; brandId: number; }
interface ModelItem { name: string; slug: string; modelId: number; years: string; }
interface EngineItem { name: string; slug: string; engineId: number; power: string; years: string; engineCode: string; }

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [brand, setBrand] = useState<BrandItem | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEngines, setLoadingEngines] = useState(false);
  const [search, setSearch] = useState("");

  // Load brand + models
  useEffect(() => {
    (async () => {
      const brandsRes = await fetch("/api/vehicles?action=brands");
      const brands: BrandItem[] = await brandsRes.json();
      const found = brands.find((b) => b.slug === slug);
      if (!found) { setLoading(false); return; }
      setBrand(found);

      const modelsRes = await fetch(`/api/vehicles?action=models&brandId=${found.brandId}`);
      const modelsData: ModelItem[] = await modelsRes.json();
      setModels(modelsData);
      setLoading(false);
    })();
  }, [slug]);

  // Load engines when model selected
  useEffect(() => {
    if (!selectedModel || !brand) return;
    setLoadingEngines(true);
    setEngines([]);
    fetch(`/api/vehicles?action=engines&brandId=${brand.brandId}&modelId=${selectedModel.modelId}`)
      .then((r) => r.json())
      .then(setEngines)
      .catch(() => {})
      .finally(() => setLoadingEngines(false));
  }, [brand, selectedModel]);

  const handleEngineSelect = (engine: EngineItem) => {
    if (!brand || !selectedModel) return;
    const params = new URLSearchParams({
      bs: brand.slug, ms: selectedModel.slug, es: engine.slug || engine.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      bi: String(brand.brandId), mi: String(selectedModel.modelId),
      bn: brand.name, mn: selectedModel.name, en: `${engine.name} ${engine.power}`,
    });
    router.push(`/vehicle/${engine.engineId}?${params}`);
  };

  const logoUrl = getCarBrandLogoUrl(slug);

  const filteredModels = search
    ? models.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : models;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
          {/* Back + brand header */}
          <div className="mb-8">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-mltext-light hover:text-primary font-semibold transition-colors mb-4">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              Zpět
            </a>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <div className="w-16 h-16 rounded-2xl bg-white border border-mlborder-light flex items-center justify-center p-2 shadow-sm">
                  <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-mltext-dark">
                  {brand?.name || slug.toUpperCase()}
                </h1>
                <p className="text-mltext-light text-sm mt-0.5">
                  {selectedModel
                    ? `Vyberte motorizaci pro ${selectedModel.name}`
                    : `${models.length} modelů — vyberte váš model`}
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Step 1: Model selection */}
          {!loading && !selectedModel && (
            <>
              {/* Search */}
              <div className="mb-5 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mltext-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Hledat model..."
                    className="w-full bg-white border-2 border-mlborder-light rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-mltext-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Models grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredModels.map((model) => (
                  <button
                    key={model.modelId}
                    onClick={() => { setSelectedModel(model); setSearch(""); }}
                    className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all p-4 flex items-center justify-between gap-3 hover:-translate-y-0.5"
                  >
                    <div>
                      <span className="block text-[15px] font-bold text-mltext-dark group-hover:text-primary transition-colors leading-tight">
                        {model.name}
                      </span>
                      {model.years && (
                        <span className="block text-[12px] text-mltext-light mt-0.5">{model.years}</span>
                      )}
                    </div>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlborder group-hover:text-primary shrink-0 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>

              {filteredModels.length === 0 && (
                <p className="text-center text-mltext-light py-12">Žádný model nenalezen</p>
              )}
            </>
          )}

          {/* Step 2: Engine selection */}
          {selectedModel && (
            <>
              {/* Back to models */}
              <button
                onClick={() => { setSelectedModel(null); setEngines([]); }}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-semibold transition-colors mb-5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                {brand?.name} — zpět na modely
              </button>

              <div className="bg-white rounded-2xl border border-mlborder-light p-6 shadow-sm mb-6">
                <h2 className="text-lg font-bold text-mltext-dark mb-1">{selectedModel.name}</h2>
                <p className="text-mltext-light text-sm">{selectedModel.years}</p>
              </div>

              {loadingEngines && (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              )}

              {!loadingEngines && engines.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {engines.map((engine) => (
                    <button
                      key={engine.engineId}
                      onClick={() => handleEngineSelect(engine)}
                      className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all p-4 flex items-center justify-between gap-4 hover:-translate-y-0.5"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block text-[15px] font-bold text-mltext-dark group-hover:text-primary transition-colors">
                          {engine.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {engine.power && (
                            <span className="text-[11px] bg-primary/[0.06] text-primary font-bold px-2 py-0.5 rounded-md">
                              {engine.power}
                            </span>
                          )}
                          {engine.engineCode && (
                            <span className="text-[11px] bg-gray-100 text-mltext font-mono px-2 py-0.5 rounded-md">
                              {engine.engineCode}
                            </span>
                          )}
                          {engine.years && (
                            <span className="text-[11px] text-mltext-light">
                              {engine.years}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/[0.06] group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 flex items-center justify-center shrink-0 transition-all">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loadingEngines && engines.length === 0 && (
                <p className="text-center text-mltext-light py-12">Žádné motorizace nenalezeny pro tento model</p>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
