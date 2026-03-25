"use client";

import { useEffect, useState } from "react";
import ProductGallery from "./ProductGallery";
import AddToCartButton from "./AddToCartButton";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";

interface LiveData {
  price: number;
  priceVAT: number;
  priceRetail: number;
  discount: number;
  qty: number;
  inStock: boolean;
  valid: boolean;
}

interface Product {
  id: string;
  product_code: string;
  name: string;
  description: string;
  brand: string;
  brand_group: string;
  category: string;
  assortment: string;
  price_min: number;
  price_max: number;
  in_stock: boolean;
  stock_qty: number;
  is_sale: boolean;
  image_url: string;
  oem_numbers: string[];
  ean_codes: string[];
  cross_numbers: string[];
}

interface TecDocAttr { key: string; value: string; }
interface Replacement { code: string; brand: string; price: number; priceVAT: number; qty: number; name: string; }

export default function ProductDetail({ product }: { product: Product }) {
  const [live, setLive] = useState<LiveData | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [tecdocAttrs, setTecdocAttrs] = useState<TecDocAttr[]>([]);
  const [tecdocVehicles, setTecdocVehicles] = useState("");
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [replacementsLoading, setReplacementsLoading] = useState(true);
  const [showAllReplacements, setShowAllReplacements] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "replacements" | "oe">("specs");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const token = (() => { try { const t = localStorage.getItem("auth_token"); const v = localStorage.getItem("auth_valid_to"); return t && v && new Date(v) > new Date() ? t : null; } catch { return null; } })();
    const headers: Record<string, string> = {};
    if (token) headers["x-user-token"] = token;

    fetch(`/api/product-live?id=${product.id}`, { headers })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setLive(d); })
      .catch(() => {})
      .finally(() => setLiveLoading(false));

    fetch(`/api/product-replacements?code=${encodeURIComponent(product.product_code)}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setReplacements(d); })
      .catch(() => {})
      .finally(() => setReplacementsLoading(false));

    fetch(`/api/product-image?id=${product.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.attributes?.length) setTecdocAttrs(d.attributes);
        if (d.vehicles) setTecdocVehicles(d.vehicles);
      })
      .catch(() => {});
  }, [product.id]);

  const formatPrice = (p: number) =>
    p.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const copyCode = () => {
    navigator.clipboard.writeText(product.product_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Compute price values
  const livePrice = live?.priceRetail || live?.price || 0;
  const showPrice = livePrice > 0 ? livePrice : product.price_min;
  const isLive = livePrice > 0;
  const showStock = live?.valid ? live.inStock : product.in_stock;
  const showQty = live?.valid ? Math.floor(live.qty) : Math.floor(product.stock_qty);

  // Key specs to show above tabs (first 4 TecDoc attrs)
  const keySpecs = tecdocAttrs.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-mltext-light mb-6 flex-wrap">
        <a href="/" className="hover:text-primary transition-colors">Katalog</a>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <a href={`/search?q=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors">{product.category}</a>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <span className="text-mltext-dark font-medium">{product.name}</span>
      </nav>

      {/* ═══ MAIN SECTION ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image gallery */}
        <ProductGallery
          imageUrl={product.image_url}
          productId={product.id}
          brand={product.brand}
          alt={product.name}
        />

        {/* Info column */}
        <div className="flex flex-col">
          {/* Brand badge + sale */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 bg-gray-50 border border-mlborder-light text-mltext-dark text-sm font-bold px-3 py-1.5 rounded-lg">
              {hasManufacturerLogo(product.brand) && (
                <img src={getManufacturerLogoUrl(product.brand)} alt="" className="h-5 w-auto object-contain" loading="lazy" />
              )}
              {product.brand}
            </span>
            {product.is_sale && (
              <span className="inline-flex items-center gap-1 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Akce
              </span>
            )}
            {live && live.discount > 0 && (
              <span className="inline-flex items-center bg-mlgreen/10 text-mlgreen text-xs font-bold px-2.5 py-1 rounded-lg">
                -{live.discount}%
              </span>
            )}
          </div>

          {/* Product name */}
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mltext-dark leading-tight mb-2">{product.name}</h1>

          {/* Product code — copyable */}
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={copyCode}
              className="group flex items-center gap-1.5 text-sm text-mltext-light hover:text-primary transition-colors"
              title="Kopírovat kód"
            >
              <span className="font-mono font-semibold">{product.product_code}</span>
              {copiedCode ? (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-mlgreen" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              )}
            </button>
            {product.ean_codes?.[0] && (
              <span className="text-xs text-mltext-light/60 ml-2">EAN: {product.ean_codes[0]}</span>
            )}
          </div>

          {/* ─── PRICE BOX ─── */}
          <div className="bg-gray-50 border border-mlborder-light rounded-2xl p-5 mb-5">
            {liveLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-9 bg-gray-200 rounded-lg w-40" />
                <div className="h-4 bg-gray-200 rounded w-28" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5 mb-1">
                  {showPrice > 0 ? (
                    <>
                      <span className="text-3xl font-black text-mltext-dark tracking-tight">{formatPrice(showPrice)}</span>
                      <span className="text-lg font-bold text-mltext-light">Kč</span>
                      {live && live.priceVAT > 0 && (
                        <span className="text-xs text-mltext-light ml-2">s DPH {formatPrice(live.priceVAT)} Kč</span>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-mltext-light">Cena na dotaz</span>
                  )}
                </div>
                {!isLive && showPrice > 0 && (
                  <p className="text-xs text-mltext-light">(orientační cena)</p>
                )}
                {product.price_min !== product.price_max && product.price_max > 0 && (
                  <p className="text-xs text-mltext-light mt-0.5">Rozsah: {formatPrice(product.price_min)} – {formatPrice(product.price_max)} Kč</p>
                )}

                {/* Stock indicator */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-mlborder-light">
                  <span className={`w-2.5 h-2.5 rounded-full ${showStock ? "bg-mlgreen" : "bg-mlorange"}`} />
                  <span className={`text-sm font-bold ${showStock ? "text-mlgreen" : "text-mlorange"}`}>
                    {showStock ? `Skladem` : "Na objednávku"}
                  </span>
                  {showStock && showQty > 0 && (
                    <span className="text-sm text-mltext-light">— {showQty} ks</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ─── ADD TO CART ─── */}
          <AddToCartButton
            id={product.id}
            productCode={product.product_code}
            brand={product.brand}
            name={product.name}
            price={live?.priceRetail || product.price_min}
            imageUrl={product.image_url}
          />

          {/* ─── KEY SPECS (quick preview) ─── */}
          {keySpecs.length > 0 && (
            <div className="mt-5 pt-5 border-t border-mlborder-light">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {keySpecs.map((attr, i) => (
                  <div key={i} className="flex items-baseline gap-1.5 text-sm">
                    <span className="text-mltext-light shrink-0">{attr.key}:</span>
                    <span className="font-semibold text-mltext-dark truncate">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── DELIVERY INFO HINTS ─── */}
          <div className="mt-5 pt-5 border-t border-mlborder-light space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-mltext">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-mltext-light shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>{showStock ? "Expedice do 24 hodin" : "Dodání 2–5 pracovních dní"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-mltext">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-mltext-light shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Záruka 24 měsíců</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-mltext">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-mltext-light shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              <span>Možnost vrácení do 14 dní</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-5 pt-5 border-t border-mlborder-light">
              <p className="text-sm text-mltext leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="mt-12">
        <div className="flex gap-0.5 border-b-2 border-mlborder-light">
          {[
            { id: "specs" as const, label: "Technické informace", count: tecdocAttrs.length + 2 },
            { id: "replacements" as const, label: "Náhrady", count: replacements.length },
            { id: "oe" as const, label: "OEM / Křížové ref.", count: (product.oem_numbers?.length || 0) + (product.cross_numbers?.length || 0) },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3.5 text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-mltext-light hover:text-mltext-dark"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-mltext-light"
                }`}>{tab.count}</span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB: Specs ─── */}
      {activeTab === "specs" && (
        <div className="mt-6 space-y-6">
          {/* Basic info table */}
          <div className="rounded-xl border border-mlborder overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-mlborder-light">
                  <td className="px-5 py-3.5 font-semibold text-mltext-light bg-gray-50/80 w-48">Značka</td>
                  <td className="px-5 py-3.5 text-mltext-dark font-medium">
                    <span className="inline-flex items-center gap-2">
                      {hasManufacturerLogo(product.brand) && (
                        <img src={getManufacturerLogoUrl(product.brand)} alt="" className="h-4 w-auto object-contain" loading="lazy" />
                      )}
                      {product.brand}
                    </span>
                  </td>
                </tr>
                {product.brand_group && (
                  <tr className="border-b border-mlborder-light">
                    <td className="px-5 py-3.5 font-semibold text-mltext-light bg-gray-50/80">Skupina</td>
                    <td className="px-5 py-3.5 text-mltext-dark">{product.brand_group}</td>
                  </tr>
                )}
                <tr className="border-b border-mlborder-light">
                  <td className="px-5 py-3.5 font-semibold text-mltext-light bg-gray-50/80">Kategorie</td>
                  <td className="px-5 py-3.5 text-mltext-dark">{product.category}</td>
                </tr>
                {product.assortment && (
                  <tr className="border-b border-mlborder-light">
                    <td className="px-5 py-3.5 font-semibold text-mltext-light bg-gray-50/80">Sortiment</td>
                    <td className="px-5 py-3.5 text-mltext-dark">{product.assortment}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-5 py-3.5 font-semibold text-mltext-light bg-gray-50/80">Kód produktu</td>
                  <td className="px-5 py-3.5 text-mltext-dark font-mono font-semibold">{product.product_code}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TecDoc specs */}
          {tecdocAttrs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-3 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-mltext-light" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                TecDoc specifikace
              </h3>
              <div className="rounded-xl border border-mlborder overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {tecdocAttrs.map((attr, i) => (
                      <tr key={i} className={i < tecdocAttrs.length - 1 ? "border-b border-mlborder-light" : ""}>
                        <td className="px-5 py-3 font-semibold text-mltext-light bg-gray-50/80 w-52">{attr.key}</td>
                        <td className="px-5 py-3 text-mltext-dark">{attr.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vehicles */}
          {tecdocVehicles && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-3 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-mltext-light" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 001 14v2c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                Vhodné pro vozidla
              </h3>
              <div className="bg-gray-50 rounded-xl border border-mlborder-light p-4">
                <p className="text-sm text-mltext leading-relaxed">{tecdocVehicles}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Replacements (Náhrady) ─── */}
      {activeTab === "replacements" && (
        <div className="mt-6">
          {replacementsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-primary" />
            </div>
          ) : replacements.length === 0 ? (
            <div className="text-center py-16">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p className="text-mltext-light">Žádné náhrady nenalezeny</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-mltext-light mb-4">
                <span className="font-bold text-mltext-dark">{replacements.length}</span> kompatibilních dílů
              </p>
              <div className="rounded-xl border border-mlborder overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-mlborder">
                      <th className="px-5 py-3 text-left font-bold text-mltext-light text-[11px] uppercase tracking-wider">Výrobce</th>
                      <th className="px-5 py-3 text-left font-bold text-mltext-light text-[11px] uppercase tracking-wider">Kód</th>
                      <th className="px-5 py-3 text-left font-bold text-mltext-light text-[11px] uppercase tracking-wider">Název</th>
                      <th className="px-5 py-3 text-right font-bold text-mltext-light text-[11px] uppercase tracking-wider">Cena</th>
                      <th className="px-5 py-3 text-right font-bold text-mltext-light text-[11px] uppercase tracking-wider">Sklad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllReplacements ? replacements : replacements.slice(0, 20)).map((r, i) => (
                      <tr key={i} className={`border-b border-mlborder-light hover:bg-primary/[0.02] transition-colors ${r.qty > 0 ? "" : "opacity-50"}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {hasManufacturerLogo(r.brand) && (
                              <img src={getManufacturerLogoUrl(r.brand)} alt="" className="h-4 w-auto object-contain" loading="lazy" />
                            )}
                            <span className="text-xs font-bold text-mltext-dark uppercase">{r.brand}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <a href={`/search?q=${encodeURIComponent(r.code)}`} className="font-mono text-[13px] text-primary hover:text-primary-dark font-bold transition-colors">
                            {r.code}
                          </a>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-mltext">{r.name}</td>
                        <td className="px-5 py-3 text-right">
                          {r.price > 0 ? (
                            <span className="text-[13px] font-bold text-mltext-dark">{r.price.toFixed(0)} Kč</span>
                          ) : (
                            <span className="text-xs text-mltext-light">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {r.qty > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-mlgreen">
                              <span className="w-1.5 h-1.5 rounded-full bg-mlgreen" />
                              {r.qty} ks
                            </span>
                          ) : (
                            <span className="text-xs text-mltext-light">Na obj.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!showAllReplacements && replacements.length > 20 && (
                <button
                  onClick={() => setShowAllReplacements(true)}
                  className="mt-4 w-full py-3 text-sm font-bold text-primary hover:text-primary-dark border-2 border-mlborder hover:border-primary/30 rounded-xl transition-all hover:bg-primary/[0.02]"
                >
                  Zobrazit všech {replacements.length} náhrad
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── TAB: OE / Cross numbers ─── */}
      {activeTab === "oe" && (
        <div className="mt-6 space-y-6">
          {(product.oem_numbers || []).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-3 flex items-center gap-2">
                OEM čísla
                <span className="text-[11px] font-bold bg-gray-100 text-mltext-light px-1.5 py-0.5 rounded-full">{product.oem_numbers.length}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {product.oem_numbers.map((n, i) => (
                  <a key={i} href={`/search?q=${encodeURIComponent(n)}`} className="inline-flex items-center gap-1 bg-gray-50 hover:bg-primary/5 border border-mlborder-light hover:border-primary/20 text-mltext hover:text-primary text-xs font-mono font-semibold px-3 py-2 rounded-lg transition-all">
                    {n}
                    <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
          {(product.ean_codes || []).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-3 flex items-center gap-2">
                EAN kódy
                <span className="text-[11px] font-bold bg-gray-100 text-mltext-light px-1.5 py-0.5 rounded-full">{product.ean_codes.length}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {product.ean_codes.map((n, i) => (
                  <span key={i} className="inline-block bg-gray-50 border border-mlborder-light text-mltext text-xs font-mono px-3 py-2 rounded-lg">{n}</span>
                ))}
              </div>
            </div>
          )}
          {(product.cross_numbers || []).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-3 flex items-center gap-2">
                Křížové reference
                <span className="text-[11px] font-bold bg-gray-100 text-mltext-light px-1.5 py-0.5 rounded-full">{product.cross_numbers.length}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {product.cross_numbers.map((n, i) => (
                  <a key={i} href={`/search?q=${encodeURIComponent(n)}`} className="inline-flex items-center gap-1 bg-gray-50 hover:bg-primary/5 border border-mlborder-light hover:border-primary/20 text-mltext hover:text-primary text-xs font-mono font-semibold px-3 py-2 rounded-lg transition-all">
                    {n}
                    <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
          {(product.oem_numbers || []).length === 0 && (product.ean_codes || []).length === 0 && (product.cross_numbers || []).length === 0 && (
            <div className="text-center py-16">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="text-mltext-light">Žádné referenční čísla</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
