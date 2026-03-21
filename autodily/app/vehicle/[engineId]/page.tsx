"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";
import { getCategoryStyle } from "@/lib/category-icons";

interface Category { nodeId: string; name: string; isEndNode: boolean; href: string; }
interface MatchedProduct {
  tecdocCode: string; tecdocBrand: string; tecdocName: string; genArtID: number | null;
  product: { id?: string; name?: string; product_code?: string; brand?: string; price_min?: number; price_max?: number; in_stock?: boolean; stock_qty?: number; image_url?: string; } | null;
}

export default function VehiclePartsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const engineId = params.engineId as string;

  const brandSlug = searchParams.get("bs") || "";
  const modelSlug = searchParams.get("ms") || "";
  const engineSlug = searchParams.get("es") || "";
  const brandId = searchParams.get("bi") || "";
  const modelId = searchParams.get("mi") || "";
  const brandName = searchParams.get("bn") || "";
  const modelName = searchParams.get("mn") || "";
  const engineName = searchParams.get("en") || "";

  const enginePageUrl = `/cs/katalog/tecdoc/osobni/${brandSlug}/${modelSlug}/${engineSlug}/${brandId}/${modelId}/${engineId}`;
  const brandLogoUrl = getCarBrandLogoUrl(brandSlug);

  const [categories, setCategories] = useState<Category[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Array<{ name: string; categoryId?: string }>>([]);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [tecdocCount, setTecdocCount] = useState(0);

  useEffect(() => { if (brandSlug) loadCategories(); }, [engineId]);

  async function loadCategories(categoryId?: string) {
    setLoading(true); setProducts([]);
    try {
      const url = `/api/vehicles?action=categories&url=${encodeURIComponent(enginePageUrl)}${categoryId ? `&categoryId=${categoryId}` : ""}`;
      const res = await fetch(url);
      setCategories(await res.json());
    } catch { setCategories([]); }
    finally { setLoading(false); }
  }

  function handleCategoryClick(cat: Category) {
    if (cat.isEndNode) { loadProducts(cat.href, cat.name); }
    else { setBreadcrumb((prev) => [...prev, { name: cat.name, categoryId: cat.nodeId }]); loadCategories(cat.nodeId); }
  }

  function handleBreadcrumbClick(index: number) {
    if (index < 0) { setBreadcrumb([]); loadCategories(); }
    else { const item = breadcrumb[index]; setBreadcrumb(breadcrumb.slice(0, index + 1)); loadCategories(item.categoryId); }
  }

  async function loadProducts(leafHref: string, categoryName: string) {
    setLoadingProducts(true); setBreadcrumb((prev) => [...prev, { name: categoryName }]);
    try {
      const res = await fetch(`/api/vehicles?action=products&leafHref=${encodeURIComponent(leafHref)}`);
      const data = await res.json();
      setProducts(data.products || []); setTecdocCount(data.tecdocCount || 0); setCategories([]);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  }

  const vehicleLabel = [brandName, modelName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
          {/* Vehicle header card */}
          <div className="bg-white rounded-2xl border border-mlborder-light p-5 lg:p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <a href={brandSlug ? `/brand/${brandSlug}` : "/"} className="text-primary hover:text-primary-dark transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </a>
              {brandLogoUrl && (
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-mlborder-light flex items-center justify-center p-1.5 shrink-0">
                  <img src={brandLogoUrl} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-mltext-dark leading-tight truncate">
                  {vehicleLabel || `Motor ${engineId}`}
                </h1>
                {engineName && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] bg-primary/[0.06] text-primary font-bold px-2 py-0.5 rounded-md">{engineName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 text-sm mb-5 flex-wrap bg-white rounded-xl border border-mlborder-light px-4 py-2.5 shadow-sm">
              <button onClick={() => handleBreadcrumbClick(-1)} className="text-primary hover:text-primary-dark font-semibold flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                Kategorie
              </button>
              {breadcrumb.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-mlborder" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  {i < breadcrumb.length - 1 ? (
                    <button onClick={() => handleBreadcrumbClick(i)} className="text-primary hover:text-primary-dark font-semibold">{item.name}</button>
                  ) : (
                    <span className="text-mltext-dark font-semibold">{item.name}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Loading */}
          {(loading || loadingProducts) && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-mlborder-light border-t-primary mb-4" />
              <span className="text-mltext-light text-sm font-medium">
                {loadingProducts ? "Načítám díly..." : "Načítám kategorie..."}
              </span>
            </div>
          )}

          {/* Categories grid */}
          {!loading && categories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const style = getCategoryStyle(cat.name);
                return (
                  <button
                    key={cat.nodeId}
                    onClick={() => handleCategoryClick(cat)}
                    className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-transparent hover:shadow-lg transition-all p-4 flex items-center gap-4 hover:-translate-y-0.5"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: style.color + "0C" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={style.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={style.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[14px] font-bold text-mltext-dark group-hover:text-primary transition-colors leading-tight">
                        {cat.name}
                      </span>
                      <span className="block text-[11px] text-mltext-light mt-0.5">
                        {cat.isEndNode ? "Zobrazit díly" : "Podkategorie"}
                      </span>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlborder group-hover:text-primary shrink-0 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {/* No categories */}
          {!loading && categories.length === 0 && products.length === 0 && !loadingProducts && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mltext-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-lg font-bold text-mltext-dark">
                {!brandSlug ? "Vyberte vozidlo na hlavní stránce" : "Žádné kategorie"}
              </p>
            </div>
          )}

          {/* Products */}
          {!loadingProducts && products.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-mltext-light">
                  <span className="font-bold text-mltext-dark">{tecdocCount}</span> dílů v TecDoc
                  {products.filter((p) => p.product).length > 0 && (
                    <> — <span className="font-bold text-mlgreen">{products.filter((p) => p.product).length}</span> v našem skladu</>
                  )}
                </p>
              </div>

              <div className="space-y-2.5">
                {products.map((item, i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-xl border p-4 flex gap-4 items-center transition-all ${
                      item.product ? "border-mlborder-light hover:border-transparent hover:shadow-lg hover:-translate-y-0.5" : "border-mlborder-light/50 opacity-50"
                    }`}
                  >
                    {/* Image or brand logo */}
                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                      ) : hasManufacturerLogo(item.product?.brand || item.tecdocBrand) ? (
                        <img src={getManufacturerLogoUrl(item.product?.brand || item.tecdocBrand)} alt="" className="h-6 w-auto object-contain" loading="lazy" />
                      ) : (
                        <span className="text-[10px] font-bold text-mltext-light uppercase">{(item.product?.brand || item.tecdocBrand).slice(0, 3)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] text-mltext-light font-bold uppercase tracking-wider">
                          {item.product?.brand || item.tecdocBrand}
                        </span>
                        <span className="text-[11px] font-mono text-mltext-light/60">{item.tecdocCode}</span>
                      </div>
                      <p className="text-[14px] font-semibold text-mltext-dark leading-tight truncate">
                        {item.product?.name || item.tecdocName || item.tecdocCode}
                      </p>
                      {item.product ? (
                        <a href={`/product/${item.product.id}`} className="text-[12px] text-primary hover:text-primary-dark font-semibold mt-0.5 inline-block">
                          Detail →
                        </a>
                      ) : (
                        <p className="text-[12px] text-mltext-light mt-0.5">Není v našem skladu</p>
                      )}
                    </div>

                    {/* Price */}
                    {item.product && (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-extrabold text-mltext-dark leading-none">
                          {item.product.price_min ? `${item.product.price_min.toFixed(0)}` : "—"}
                          <span className="text-sm font-bold text-mltext-light ml-0.5">Kč</span>
                        </p>
                        <p className={`text-[11px] font-bold mt-1 ${item.product.in_stock ? "text-mlgreen" : "text-mltext-light"}`}>
                          {item.product.in_stock ? `${item.product.stock_qty?.toFixed(0)} ks` : "Na obj."}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
