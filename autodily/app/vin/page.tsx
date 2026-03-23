"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VinInput from "@/components/VinInput";
import { getCategoryStyle, getCategoryImage } from "@/lib/category-icons";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";

interface Vehicle {
  name: string; model: string; engine: string; engineCode: string; years: string; gearbox: string; url: string;
}
interface CategoryItem { name: string; url: string; isGroup: boolean; }
interface OeItem { position: string; oe: string; name: string; url: string; }
interface ProductItem {
  brand: string; code: string; name: string; imageUrl: string;
  price: string; priceNoVat: string; stock: string; deliveryInfo: string;
}

type Step = "vin" | "vehicles" | "categories" | "oes" | "products";

export default function VinPage() {
  const [step, setStep] = useState<Step>("vin");
  const [vin, setVin] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [oes, setOes] = useState<OeItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [partsTitle, setPartsTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  async function handleVinSubmit(vinCode: string) {
    setLoading(true); setError(""); setVin(vinCode);
    try {
      const res = await fetch(`/api/vin?vin=${encodeURIComponent(vinCode)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setVehicles(data.vehicles || []);
      setStep("vehicles");
      setBreadcrumb(["VIN: " + vinCode]);
    } catch { setError("Nepodařilo se vyhledat VIN"); }
    finally { setLoading(false); }
  }

  async function handleSelectVehicle(vehicle: Vehicle) {
    setSelectedVehicle(vehicle); setLoading(true); setError("");
    try {
      const res = await fetch(`/api/vin?action=categories&url=${encodeURIComponent(vehicle.url)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setCategories(data.categories || []);
      setStep("categories");
      setBreadcrumb(["VIN: " + vin, `${vehicle.name} ${vehicle.model}`]);
    } catch { setError("Nepodařilo se načíst kategorie"); }
    finally { setLoading(false); }
  }

  async function handleSelectCategory(cat: CategoryItem) {
    if (!cat.url) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/vin?action=parts&url=${encodeURIComponent(cat.url)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setOes(data.oes || []);
      setProducts(data.products || []);
      setPartsTitle(data.title || cat.name);
      if (data.products?.length > 0) {
        setStep("products");
      } else if (data.oes?.length > 0) {
        setStep("oes");
      } else {
        setStep("products"); // show empty state
      }
      setBreadcrumb(prev => [...prev.slice(0, 2), cat.name]);
    } catch { setError("Nepodařilo se načíst díly"); }
    finally { setLoading(false); }
  }

  async function handleSelectOe(oe: OeItem) {
    if (!oe.url) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/vin?action=parts&url=${encodeURIComponent(oe.url)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setProducts(data.products || []);
      setPartsTitle(oe.name || oe.oe);
      setStep("products");
      setBreadcrumb(prev => [...prev.slice(0, 3), oe.oe]);
    } catch { setError("Nepodařilo se načíst produkty"); }
    finally { setLoading(false); }
  }

  function goBack() {
    setError("");
    if (step === "products" && oes.length > 0) { setStep("oes"); setProducts([]); setBreadcrumb(b => b.slice(0, 3)); }
    else if (step === "products" || step === "oes") { setStep("categories"); setOes([]); setProducts([]); setBreadcrumb(b => b.slice(0, 2)); }
    else if (step === "categories") { setStep("vehicles"); setCategories([]); setBreadcrumb(b => b.slice(0, 1)); }
    else if (step === "vehicles") { setStep("vin"); setVehicles([]); setBreadcrumb([]); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header showSearch={false} />

      <div className="flex-1">
        {/* Hero */}
        <div className="bg-mlbg relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-primary/6 rounded-full blur-[100px]" />
          </div>
          <div className="relative max-w-200 mx-auto px-4 lg:px-8 py-10 text-center">
            <h1 className="text-white text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
              Vyhledávání podle <span className="text-gradient">VIN kódu</span>
            </h1>
            <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
              Zadejte 17místný VIN kód pro přesné nalezení dílů z originálních schémat
            </p>
            <VinInput onSubmit={handleVinSubmit} loading={loading && step === "vin"} />
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && !loading && (
            <nav className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
              {breadcrumb.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <svg viewBox="0 0 24 24" className="w-3 h-3 text-mlborder" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>}
                  <span className={i === breadcrumb.length - 1 ? "text-mltext-dark font-semibold" : "text-mltext-light"}>{item}</span>
                </span>
              ))}
            </nav>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm font-medium">{error}</div>
          )}

          {loading && step !== "vin" && (
            <div className="flex flex-col items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-mlborder-light border-t-primary mb-4" />
              <span className="text-mltext-light text-sm">Načítám data z katalogu...</span>
              <span className="text-mltext-light/50 text-xs mt-1">Může trvat několik sekund</span>
            </div>
          )}

          {step !== "vin" && !loading && (
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-semibold mb-5 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              Zpět
            </button>
          )}

          {/* VEHICLES */}
          {step === "vehicles" && !loading && (
            <>
              <h2 className="text-xl font-bold text-mltext-dark mb-4">Nalezená vozidla</h2>
              {vehicles.length === 0 ? (
                <p className="text-mltext-light text-center py-12">Žádné vozidlo nenalezeno pro tento VIN</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {vehicles.map((v, i) => (
                    <button key={i} onClick={() => handleSelectVehicle(v)} className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all p-5 hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="block text-lg font-bold text-mltext-dark group-hover:text-primary transition-colors">{v.name} {v.model}</span>
                          <span className="block text-sm text-mltext mt-1">{v.engine}</span>
                          <div className="flex flex-wrap gap-2 mt-2.5">
                            {v.engineCode && <span className="text-[11px] bg-primary/6 text-primary font-bold px-2 py-0.5 rounded-md">{v.engineCode}</span>}
                            {v.years && <span className="text-[11px] bg-gray-100 text-mltext font-medium px-2 py-0.5 rounded-md">{v.years}</span>}
                            {v.gearbox && <span className="text-[11px] bg-gray-100 text-mltext font-mono px-2 py-0.5 rounded-md">{v.gearbox}</span>}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/6 group-hover:bg-primary flex items-center justify-center shrink-0 transition-all group-hover:shadow-lg group-hover:shadow-primary/30">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* CATEGORIES */}
          {step === "categories" && !loading && (
            <>
              <div className="bg-white rounded-2xl border border-mlborder-light p-5 mb-6 shadow-sm">
                <span className="text-sm text-mltext-light">Vozidlo:</span>
                <span className="block text-lg font-bold text-mltext-dark">{selectedVehicle?.name} {selectedVehicle?.model} — {selectedVehicle?.engine}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.filter(c => !c.isGroup && c.url).map((cat, i) => {
                  const style = getCategoryStyle(cat.name);
                  const image = getCategoryImage(cat.name);
                  return (
                    <button key={i} onClick={() => handleSelectCategory(cat)} className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all p-4 flex items-center gap-4 hover:-translate-y-0.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-mlborder-light shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {image ? (
                          <img src={image} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={style.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={style.icon} /></svg>
                        )}
                      </div>
                      <span className="text-[14px] font-bold text-mltext-dark group-hover:text-primary transition-colors flex-1">{cat.name}</span>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlborder group-hover:text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* OE NUMBERS */}
          {step === "oes" && !loading && (
            <>
              <h2 className="text-xl font-bold text-mltext-dark mb-4">OE čísla — {partsTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {oes.map((oe, i) => (
                  <button key={i} onClick={() => handleSelectOe(oe)} className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all p-4 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-primary/6 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">{oe.position || "#"}</span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-mltext-dark font-mono group-hover:text-primary transition-colors">{oe.oe}</span>
                        <span className="block text-[12px] text-mltext-light truncate">{oe.name}</span>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlborder group-hover:text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* PRODUCTS */}
          {step === "products" && !loading && (
            <>
              <h2 className="text-xl font-bold text-mltext-dark mb-4">
                Dostupné díly{partsTitle ? ` — ${partsTitle}` : ""} <span className="text-mltext-light font-normal text-base">({products.length})</span>
              </h2>
              {products.length === 0 ? (
                <p className="text-mltext-light text-center py-12">Žádné díly nenalezeny</p>
              ) : (
                <div className="space-y-2.5">
                  {products.map((p, i) => (
                    <div key={i} className="bg-white rounded-xl border border-mlborder-light p-4 flex gap-4 items-center hover:shadow-md transition-all">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl bg-gray-50 border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                        ) : hasManufacturerLogo(p.brand) ? (
                          <img src={getManufacturerLogoUrl(p.brand)} alt="" className="h-6 w-auto object-contain opacity-30" />
                        ) : (
                          <span className="text-[10px] font-bold text-mltext-light/40 uppercase">{p.brand.slice(0, 4)}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {hasManufacturerLogo(p.brand) && (
                            <img src={getManufacturerLogoUrl(p.brand)} alt="" className="h-3.5 w-auto object-contain" />
                          )}
                          <span className="text-[11px] text-mltext-light font-bold uppercase tracking-wider">{p.brand}</span>
                        </div>
                        <span className="block text-[15px] font-bold text-mltext-dark">{p.name || p.code}</span>
                        <span className="text-[12px] text-mltext-light font-mono">{p.code}</span>
                        {p.stock && <span className="ml-2 text-[11px] text-mlgreen font-bold">{p.stock}</span>}
                        {p.deliveryInfo && <span className="block text-[11px] text-mltext-light mt-0.5">{p.deliveryInfo}</span>}
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        {p.price ? (
                          <>
                            <span className="text-xl font-extrabold text-mltext-dark">{p.price}</span>
                            <span className="text-sm font-bold text-mltext-light ml-0.5">Kč</span>
                            {p.priceNoVat && (
                              <span className="block text-[11px] text-mltext-light">{p.priceNoVat} Kč bez DPH</span>
                            )}
                          </>
                        ) : (
                          <span className="text-mltext-light text-sm">Na dotaz</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Info cards on VIN step */}
          {step === "vin" && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {[
                { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516", title: "Přesná identifikace", desc: "VIN kód přesně určí váš vůz — motorizaci, výbavu a rok výroby" },
                { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35", title: "Originální díly", desc: "Najděte díly podle originálních OE čísel z technických schémat" },
                { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "Kde najdu VIN?", desc: "Na technickém průkazu, pod čelním sklem, nebo na štítku ve dveřích řidiče" },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl border border-mlborder-light p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-primary/6 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                  </div>
                  <h3 className="text-mltext-dark font-bold text-base mb-1.5">{item.title}</h3>
                  <p className="text-mltext-light text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
