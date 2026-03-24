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

  useEffect(() => {
    // Fetch live price — with user token if logged in (gets customer-specific prices)
    const token = (() => { try { const t = localStorage.getItem("auth_token"); const v = localStorage.getItem("auth_valid_to"); return t && v && new Date(v) > new Date() ? t : null; } catch { return null; } })();
    const headers: Record<string, string> = {};
    if (token) headers["x-user-token"] = token;

    fetch(`/api/product-live?id=${product.id}`, { headers })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setLive(d); })
      .catch(() => {})
      .finally(() => setLiveLoading(false));

    // Fetch replacements from Nextis
    fetch(`/api/product-replacements?code=${encodeURIComponent(product.product_code)}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setReplacements(d); })
      .catch(() => {})
      .finally(() => setReplacementsLoading(false));

    // Fetch TecDoc attributes
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-mltext-light mb-6">
        <a href="/" className="hover:text-primary transition-colors">Katalog</a>
        <span className="mx-2">&gt;</span>
        <span>{product.category}</span>
        <span className="mx-2">&gt;</span>
        <span className="text-mltext-dark">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <ProductGallery
          imageUrl={product.image_url}
          productId={product.id}
          brand={product.brand}
          alt={product.name}
        />

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-primary/[0.06] text-primary text-sm font-semibold px-3 py-1.5 rounded-lg">
              {hasManufacturerLogo(product.brand) && (
                <img src={getManufacturerLogoUrl(product.brand)} alt="" className="h-5 w-auto object-contain" loading="lazy" />
              )}
              {product.brand}
            </span>
            {product.is_sale && (
              <span className="inline-block bg-primary-badge text-white text-sm font-bold px-3 py-1 rounded">
                Akce
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-mltext-dark mb-2">{product.name}</h1>
          <p className="text-mltext-light mb-4">Kód: {product.product_code}</p>

          {/* Live price */}
          <div className="bg-gray-50 border border-mlborder-light rounded-xl p-5 mb-4">
            {(() => {
              // Use live price if valid, otherwise fallback to static
              const livePrice = live?.priceRetail || live?.price || 0;
              const showPrice = livePrice > 0 ? livePrice : product.price_min;
              const isLive = livePrice > 0;
              const showStock = live?.valid ? live.inStock : product.in_stock;
              const showQty = live?.valid ? Math.floor(live.qty) : Math.floor(product.stock_qty);

              if (liveLoading) {
                return (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                );
              }

              return (
                <>
                  {showPrice > 0 ? (
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-extrabold text-mltext-dark">{formatPrice(showPrice)}</span>
                      <span className="text-lg font-bold text-mltext-light mb-0.5">Kč</span>
                      {!isLive && <span className="text-xs text-mltext-light mb-1">(orientační)</span>}
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-mltext-light">Cena na dotaz</p>
                  )}
                  {live && live.discount > 0 && (
                    <p className="text-sm text-mlgreen mt-1 font-semibold">Sleva {live.discount}%</p>
                  )}
                  {product.price_min !== product.price_max && product.price_max > 0 && (
                    <p className="text-xs text-mltext-light mt-1">Rozsah: {formatPrice(product.price_min)} – {formatPrice(product.price_max)} Kč</p>
                  )}

                  {/* Stock */}
                  <div className="mt-3 pt-3 border-t border-mlborder-light">
                    <p className={`text-sm font-semibold ${showStock ? "text-mlgreen" : "text-mlorange"}`}>
                      {showStock ? `Skladem — ${showQty} ks` : "Na objednávku"}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Add to cart */}
          <AddToCartButton
            id={product.id}
            productCode={product.product_code}
            brand={product.brand}
            name={product.name}
            price={live?.priceRetail || product.price_min}
            imageUrl={product.image_url}
          />

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h2 className="font-bold text-mltext-dark mb-2">Popis</h2>
              <p className="text-mltext text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="mt-10">
        <div className="flex gap-1 border-b border-mlborder mb-0">
          {[
            { id: "specs" as const, label: "Technické informace", count: tecdocAttrs.length },
            { id: "replacements" as const, label: "Náhrady", count: replacements.length },
            { id: "oe" as const, label: "OEM / Křížové ref.", count: (product.oem_numbers?.length || 0) + (product.cross_numbers?.length || 0) },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-mltext-light hover:text-mltext-dark"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-mltext-light"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB: Specs ─── */}
      {activeTab === "specs" && (
        <div className="mt-4 space-y-6">
          <div className="bg-white rounded-xl border border-mlborder overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-mlborder-light"><td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50 w-44">Značka</td><td className="px-4 py-3 text-mltext-dark">{product.brand}</td></tr>
                {product.brand_group && <tr className="border-b border-mlborder-light"><td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50">Skupina</td><td className="px-4 py-3 text-mltext-dark">{product.brand_group}</td></tr>}
                <tr className="border-b border-mlborder-light"><td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50">Kategorie</td><td className="px-4 py-3 text-mltext-dark">{product.category}</td></tr>
                {product.assortment && <tr className="border-b border-mlborder-light"><td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50">Sortiment</td><td className="px-4 py-3 text-mltext-dark">{product.assortment}</td></tr>}
              </tbody>
            </table>
          </div>
          {tecdocAttrs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-2">TecDoc specifikace</h3>
              <div className="bg-white rounded-xl border border-mlborder overflow-hidden">
                <table className="w-full text-sm"><tbody>
                  {tecdocAttrs.map((attr, i) => (
                    <tr key={i} className={i < tecdocAttrs.length - 1 ? "border-b border-mlborder-light" : ""}>
                      <td className="px-4 py-2.5 font-semibold text-mltext-light bg-gray-50 w-52 text-[13px]">{attr.key}</td>
                      <td className="px-4 py-2.5 text-mltext-dark text-[13px]">{attr.value}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </div>
          )}
          {tecdocVehicles && (
            <div>
              <h3 className="text-sm font-bold text-mltext-dark mb-2">Vhodné pro vozidla</h3>
              <div className="bg-gray-50 rounded-xl border border-mlborder-light p-4">
                <p className="text-sm text-mltext leading-relaxed">{tecdocVehicles}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Replacements (Náhrady) ─── */}
      {activeTab === "replacements" && (
        <div className="mt-4">
          {replacementsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-primary" />
            </div>
          ) : replacements.length === 0 ? (
            <p className="text-center text-mltext-light py-12">Žádné náhrady nenalezeny</p>
          ) : (
            <>
              <p className="text-sm text-mltext-light mb-4">{replacements.length} kompatibilních dílů</p>
              <div className="bg-white rounded-xl border border-mlborder overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-mlborder">
                      <th className="px-4 py-2.5 text-left font-bold text-mltext-light text-[12px] uppercase tracking-wider">Výrobce</th>
                      <th className="px-4 py-2.5 text-left font-bold text-mltext-light text-[12px] uppercase tracking-wider">Kód</th>
                      <th className="px-4 py-2.5 text-left font-bold text-mltext-light text-[12px] uppercase tracking-wider">Název</th>
                      <th className="px-4 py-2.5 text-right font-bold text-mltext-light text-[12px] uppercase tracking-wider">Cena</th>
                      <th className="px-4 py-2.5 text-right font-bold text-mltext-light text-[12px] uppercase tracking-wider">Sklad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllReplacements ? replacements : replacements.slice(0, 20)).map((r, i) => (
                      <tr key={i} className={`border-b border-mlborder-light hover:bg-gray-50 transition-colors ${r.qty > 0 ? "" : "opacity-60"}`}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {hasManufacturerLogo(r.brand) && (
                              <img src={getManufacturerLogoUrl(r.brand)} alt="" className="h-4 w-auto object-contain" loading="lazy" />
                            )}
                            <span className="text-[12px] font-bold text-mltext-dark uppercase">{r.brand}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <a href={`/search?q=${encodeURIComponent(r.code)}`} className="text-[13px] font-mono text-primary hover:text-primary-dark font-semibold transition-colors">
                            {r.code}
                          </a>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-mltext">{r.name}</td>
                        <td className="px-4 py-2.5 text-right">
                          {r.price > 0 ? (
                            <span className="text-[13px] font-bold text-mltext-dark">{r.price.toFixed(0)} Kč</span>
                          ) : (
                            <span className="text-[12px] text-mltext-light">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {r.qty > 0 ? (
                            <span className="text-[12px] font-bold text-mlgreen">{r.qty} ks</span>
                          ) : (
                            <span className="text-[12px] text-mltext-light">Na obj.</span>
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
                  className="mt-4 w-full py-2.5 text-sm font-bold text-primary hover:text-primary-dark border-2 border-mlborder hover:border-primary/20 rounded-xl transition-all"
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
        <div className="mt-4">
          {(product.oem_numbers || []).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-mltext-dark mb-3">OEM čísla ({(product.oem_numbers || []).length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {(product.oem_numbers || []).map((n, i) => (
                  <a key={i} href={`/search?q=${encodeURIComponent(n)}`} className="inline-block bg-gray-100 hover:bg-primary/10 text-mltext hover:text-primary text-xs font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    {n}
                  </a>
                ))}
              </div>
            </div>
          )}
          {(product.ean_codes || []).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-mltext-dark mb-3">EAN kódy ({(product.ean_codes || []).length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {(product.ean_codes || []).map((n, i) => (
                  <span key={i} className="inline-block bg-gray-100 text-mltext text-xs font-mono px-3 py-1.5 rounded-lg">{n}</span>
                ))}
              </div>
            </div>
          )}
          {(product.cross_numbers || []).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-mltext-dark mb-3">Křížové reference ({(product.cross_numbers || []).length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {(product.cross_numbers || []).map((n, i) => (
                  <a key={i} href={`/search?q=${encodeURIComponent(n)}`} className="inline-block bg-gray-100 hover:bg-primary/10 text-mltext hover:text-primary text-xs font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    {n}
                  </a>
                ))}
              </div>
            </div>
          )}
          {(product.oem_numbers || []).length === 0 && (product.ean_codes || []).length === 0 && (product.cross_numbers || []).length === 0 && (
            <p className="text-center text-mltext-light py-12">Žádné referenční čísla</p>
          )}
        </div>
      )}
    </div>
  );
}
