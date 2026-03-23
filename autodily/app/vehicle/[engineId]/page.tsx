"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";
import { getCategoryStyle, getCategoryImage } from "@/lib/category-icons";
import { useCart } from "@/lib/cart";

interface Category { nodeId: string; name: string; isEndNode: boolean; href: string; }
interface MatchedProduct {
  tecdocCode: string; tecdocBrand: string; tecdocName: string; genArtID: number | null;
  product: { id?: string; name?: string; product_code?: string; brand?: string; image_url?: string; } | null;
  nextisPrice: number | null;
  nextisPriceVAT: number | null;
  nextisQty: number | null;
  nextisDiscount: number | null;
}

export default function VehiclePartsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const engineId = params.engineId as string;

  const brandSlug = searchParams.get("bs") || "";
  const modelSlug = searchParams.get("ms") || "";
  const engineSlug = searchParams.get("es") || "";
  const brandId = searchParams.get("bi") || "";
  const modelId = searchParams.get("mi") || "";
  const brandName = searchParams.get("bn") || "";
  const modelName = searchParams.get("mn") || "";
  const engineName = searchParams.get("en") || "";

  const cart = useCart();
  const enginePageUrl = `/cs/katalog/tecdoc/osobni/${brandSlug}/${modelSlug}/${engineSlug}/${brandId}/${modelId}/${engineId}`;
  const brandLogoUrl = getCarBrandLogoUrl(brandSlug);

  // URL-driven state for back/forward navigation
  const catParam = searchParams.get("cat") || "";
  const catPathParam = searchParams.get("catPath") || "";
  const leafParam = searchParams.get("leaf") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [allRootCategories, setAllRootCategories] = useState<Category[]>([]);
  const [expandedSidebarCat, setExpandedSidebarCat] = useState<string | null>(null);
  const [sidebarSubcats, setSidebarSubcats] = useState<Category[]>([]);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [tecdocCount, setTecdocCount] = useState(0);
  const [vehicleInfo, setVehicleInfo] = useState<{ imageUrl?: string; power?: string; engineCodes?: string; fuel?: string; years?: string; body?: string } | null>(null);

  // Build breadcrumb from URL
  const breadcrumb = useMemo(() => {
    if (!catPathParam) return [];
    return catPathParam.split("~").filter(Boolean).map((part) => {
      const [id, ...nameParts] = part.split(":");
      return { name: nameParts.join(":") || id, categoryId: id };
    });
  }, [catPathParam]);

  // Load data based on URL params
  useEffect(() => {
    // Load root categories for sidebar
    fetch(`/api/vehicles?action=categories&engineId=${engineId}`)
      .then((r) => r.json())
      .then((d) => setAllRootCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
    // Vehicle info
    if (engineId) {
      fetch(`/api/vehicle-info?engineId=${engineId}`).then(r => r.json()).then(setVehicleInfo).catch(() => {});
    }
  }, [engineId]);

  // React to URL changes (including back/forward)
  useEffect(() => {
    if (leafParam) {
      // Load products for leaf category
      setLoadingProducts(true); setVisibleCount(15); setCategories([]);
      fetch(`/api/vehicles?action=products&engineId=${engineId}&categoryId=${leafParam}&bs=${brandSlug}&ms=${modelSlug}&es=${engineSlug}&bi=${brandId}&mi=${modelId}`)
        .then((r) => r.json())
        .then((data) => { setProducts(data.products || []); setTecdocCount(data.tecdocCount || 0); })
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false));
    } else {
      // Load categories
      setProducts([]);
      setLoading(true);
      const parentId = catParam || undefined;
      fetch(`/api/vehicles?action=categories&engineId=${engineId}${parentId ? `&parentId=${parentId}` : ""}`)
        .then((r) => r.json())
        .then((d) => setCategories(Array.isArray(d) ? d : []))
        .catch(() => setCategories([]))
        .finally(() => setLoading(false));
    }
  }, [engineId, catParam, leafParam]);

  // Build URL with vehicle params preserved
  function vehicleUrl(extra: Record<string, string>) {
    const base = new URLSearchParams({
      bs: brandSlug, ms: modelSlug, es: engineSlug,
      bi: brandId, mi: modelId,
      bn: brandName, mn: modelName, en: engineName,
    });
    for (const [k, v] of Object.entries(extra)) {
      if (v) base.set(k, v); else base.delete(k);
    }
    return `/vehicle/${engineId}?${base}`;
  }

  function handleCategoryClick(cat: Category) {
    const newPath = catPathParam ? `${catPathParam}~${cat.nodeId}:${cat.name}` : `${cat.nodeId}:${cat.name}`;
    if (cat.isEndNode) {
      router.push(vehicleUrl({ cat: "", catPath: newPath, leaf: cat.nodeId }));
    } else {
      router.push(vehicleUrl({ cat: cat.nodeId, catPath: newPath, leaf: "" }));
    }
  }

  function handleBreadcrumbClick(index: number) {
    if (index < 0) {
      router.push(vehicleUrl({ cat: "", catPath: "", leaf: "" }));
    } else {
      const item = breadcrumb[index];
      const newPath = breadcrumb.slice(0, index + 1).map((b) => `${b.categoryId}:${b.name}`).join("~");
      router.push(vehicleUrl({ cat: item.categoryId || "", catPath: newPath, leaf: "" }));
    }
  }

  const vehicleLabel = [brandName, modelName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      {/* ═══ CONTENT WITH SIDEBAR ═══ */}
      <div className="flex-1 flex">
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-mlborder-light bg-white overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)", position: "sticky", top: "64px" }}>
          <div className="py-3">
            <p className="px-4 text-[10px] font-bold text-mltext-light uppercase tracking-wider mb-2">Kategorie dílů</p>
            {allRootCategories.map((cat) => {
              const isActive = breadcrumb.some((b) => b.categoryId === cat.nodeId);
              const isExpanded = expandedSidebarCat === cat.nodeId;
              return (
                <div key={cat.nodeId}>
                  <button
                    onClick={() => {
                      const path = `${cat.nodeId}:${cat.name}`;
                      if (cat.isEndNode) {
                        router.push(vehicleUrl({ cat: "", catPath: path, leaf: cat.nodeId }));
                      } else {
                        if (isExpanded) { setExpandedSidebarCat(null); setSidebarSubcats([]); }
                        else {
                          setExpandedSidebarCat(cat.nodeId);
                          fetch(`/api/vehicles?action=categories&engineId=${engineId}&parentId=${cat.nodeId}`)
                            .then((r) => r.json()).then((d) => setSidebarSubcats(Array.isArray(d) ? d : [])).catch(() => {});
                        }
                        router.push(vehicleUrl({ cat: cat.nodeId, catPath: path, leaf: "" }));
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-left text-[13px] transition-colors ${isActive ? "text-primary font-bold bg-primary/[0.04]" : "text-mltext hover:bg-gray-50 font-medium"}`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {!cat.isEndNode && (
                      <svg viewBox="0 0 24 24" className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""} ${isActive ? "text-primary" : "text-mltext-light/40"}`} fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    )}
                  </button>
                  {isExpanded && sidebarSubcats.length > 0 && (
                    <div className="bg-gray-50/50">
                      {sidebarSubcats.map((sub) => (
                        <button key={sub.nodeId} onClick={() => {
                          const path = `${cat.nodeId}:${cat.name}~${sub.nodeId}:${sub.name}`;
                          if (sub.isEndNode) router.push(vehicleUrl({ cat: "", catPath: path, leaf: sub.nodeId }));
                          else router.push(vehicleUrl({ cat: sub.nodeId, catPath: path, leaf: "" }));
                        }} className="w-full flex items-center justify-between pl-8 pr-4 py-1.5 text-left text-[12px] text-mltext-light hover:text-primary hover:bg-gray-50 transition-colors">
                          <span className="truncate">{sub.name}</span>
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 shrink-0 text-mltext-light/30" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT SIDE — vehicle bar + content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Vehicle top bar */}
          <div className="bg-white border-b border-mlborder-light">
            <div className="px-4 lg:px-8 py-4">
              <div className="flex items-center gap-5">
            {/* Car photo */}
            {vehicleInfo?.imageUrl && (
              <div className="hidden sm:block w-28 h-20 rounded-xl bg-gray-50 border border-mlborder-light overflow-hidden shrink-0">
                <img src={vehicleInfo.imageUrl} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}

            {/* Brand logo + vehicle name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {brandLogoUrl && (
                <img src={brandLogoUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-mltext-dark leading-tight truncate">
                  {vehicleLabel || `Motor ${engineId}`}
                </h1>
                {engineName && (
                  <span className="text-[12px] text-primary font-bold">{engineName}</span>
                )}
              </div>
            </div>

            {/* Specs pills */}
            {vehicleInfo && (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                {vehicleInfo.power && (
                  <span className="text-[11px] font-bold text-white bg-primary rounded-lg px-3 py-1.5">{vehicleInfo.power}</span>
                )}
                {vehicleInfo.fuel && (
                  <span className="text-[11px] font-bold text-mltext bg-gray-100 rounded-lg px-3 py-1.5">{vehicleInfo.fuel}</span>
                )}
                {vehicleInfo.years && (
                  <span className="text-[11px] font-medium text-mltext-light bg-gray-50 rounded-lg px-3 py-1.5">{vehicleInfo.years}</span>
                )}
                {vehicleInfo.body && (
                  <span className="text-[11px] font-medium text-mltext-light bg-gray-50 rounded-lg px-3 py-1.5">{vehicleInfo.body}</span>
                )}
              </div>
            )}

            {/* Change vehicle */}
            <a href="/" className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary-dark font-bold shrink-0 bg-primary/[0.06] hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              Změnit
            </a>
          </div>
        </div>
      </div>

          {/* Main content area */}
          <div className="px-4 lg:px-8 py-6">

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
              <button onClick={() => handleBreadcrumbClick(-1)} className="text-primary hover:text-primary-dark font-semibold flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                Kategorie
              </button>
              {breadcrumb.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
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
                const image = getCategoryImage(cat.name);
                return (
                  <button
                    key={cat.nodeId}
                    onClick={() => handleCategoryClick(cat)}
                    className="group text-left bg-white rounded-2xl border border-mlborder-light hover:border-transparent hover:shadow-xl transition-all p-5 flex items-center gap-5 hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-mlborder-light shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {image ? (
                        <img src={image} alt="" className="w-full h-full object-contain p-1.5" loading="lazy" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke={style.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d={style.icon} />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold text-mltext-dark group-hover:text-primary transition-colors leading-tight">
                        {cat.name}
                      </span>
                      <span className="block text-[12px] text-mltext-light mt-1">
                        {cat.isEndNode ? "Zobrazit díly" : "Podkategorie"}
                      </span>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-mlborder group-hover:text-primary shrink-0 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
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

              <div className="space-y-3">
                {products.slice(0, visibleCount).map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-mlborder-light p-5 flex gap-5 items-start transition-all hover:shadow-lg"
                  >
                    {/* Product image */}
                    <a href={item.product?.id ? `/product/${item.product.id}` : `/search?q=${encodeURIComponent(item.tecdocCode)}`} className="w-20 h-20 rounded-xl bg-gray-50 border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden hover:border-primary/20 transition-colors">
                      <ProductThumb
                        imageUrl={item.product?.image_url as string}
                        productId={item.product?.id as string}
                        productCode={item.tecdocCode}
                        brand={item.tecdocBrand}
                      />
                    </a>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {hasManufacturerLogo(item.tecdocBrand) && (
                          <img src={getManufacturerLogoUrl(item.tecdocBrand)} alt="" className="h-3.5 w-auto object-contain" loading="lazy" />
                        )}
                        <span className="text-[11px] text-mltext-light font-bold uppercase tracking-wider">
                          {item.tecdocBrand}
                        </span>
                        <span className="text-[11px] font-mono text-primary/60 bg-primary/[0.04] px-1.5 py-0.5 rounded">{item.tecdocCode}</span>
                        {/* Source badge for testing */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.product ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}>
                          {item.product ? "TS" : "API"}
                        </span>
                      </div>
                      <p className="text-[15px] font-bold text-mltext-dark leading-tight truncate">
                        {item.product?.name || item.tecdocName || item.tecdocCode}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className={`text-[12px] font-bold ${(item.nextisQty || 0) > 0 ? "text-mlgreen" : "text-mltext-light"}`}>
                          {(item.nextisQty || 0) > 0 ? `Skladem ${item.nextisQty} ks` : "Na objednávku"}
                        </p>
                        <a
                          href={item.product?.id ? `/product/${item.product.id}` : `/search?q=${encodeURIComponent(item.tecdocCode)}`}
                          className="text-[12px] text-primary hover:text-primary-dark font-semibold transition-colors"
                        >
                          Detail →
                        </a>
                      </div>
                    </div>

                    {/* Price + Cart */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {item.nextisPrice ? (
                        <>
                          <div className="text-right">
                            <p className="text-xl font-extrabold text-mltext-dark leading-none">
                              {item.nextisPrice.toFixed(0)}
                              <span className="text-sm font-bold text-mltext-light ml-0.5">Kč</span>
                            </p>
                            {item.nextisPriceVAT && (
                              <p className="text-[11px] text-mltext-light mt-0.5">{item.nextisPriceVAT.toFixed(0)} Kč s DPH</p>
                            )}
                          </div>
                          <button
                            onClick={() => cart.addItem({
                              id: item.product?.id as string || item.tecdocCode,
                              productCode: item.tecdocCode,
                              brand: item.tecdocBrand,
                              name: item.product?.name as string || item.tecdocName,
                              price: item.nextisPrice || 0,
                              imageUrl: item.product?.image_url as string || "",
                              qty: 1,
                            })}
                            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[12px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                            Do košíku
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-mltext-light">Na dotaz</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show more button */}
              {visibleCount < products.length && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setVisibleCount((v) => v + 15)}
                    className="inline-flex items-center gap-2 bg-white border-2 border-mlborder hover:border-primary/30 text-mltext-dark font-bold text-sm px-8 py-3 rounded-xl transition-all hover:shadow-md"
                  >
                    Zobrazit další ({products.length - visibleCount} zbývá)
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/** Lazy-loads product image: Typesense → TecDoc API by productId → TecDoc API by code */
function ProductThumb({ imageUrl, productId, productCode, brand }: { imageUrl?: string; productId?: string; productCode?: string; brand: string }) {
  const [src, setSrc] = useState(imageUrl || "");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (src || tried) return;
    setTried(true);

    // Try Typesense product first (has cached image)
    if (productId) {
      fetch(`/api/product-image?id=${productId}`)
        .then((r) => r.json())
        .then((d) => { if (d.imageUrl) { setSrc(d.imageUrl); return; } throw new Error("no image"); })
        .catch(() => {
          // Fallback: TecDoc getArticles by code
          if (productCode) fetchByCode(productCode);
        });
    } else if (productCode) {
      fetchByCode(productCode);
    }
  }, [src, tried, productId, productCode]);

  function fetchByCode(code: string) {
    fetch(`/api/product-image?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d) => { if (d.imageUrl) setSrc(d.imageUrl); })
      .catch(() => {});
  }

  if (src) {
    return <img src={src} alt="" className="w-full h-full object-contain p-1.5" loading="lazy" />;
  }
  if (hasManufacturerLogo(brand)) {
    return <img src={getManufacturerLogoUrl(brand)} alt="" className="h-7 w-auto object-contain opacity-30" loading="lazy" />;
  }
  return <span className="text-[11px] font-bold text-mltext-light/30 uppercase">{brand.slice(0, 3)}</span>;
}
