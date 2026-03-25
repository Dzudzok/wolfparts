"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";
import { getCategoryStyle, getCategoryImage } from "@/lib/category-icons";
import { useCart } from "@/lib/cart";
import SchematicSidebar from "@/components/SchematicSidebar";

interface Category { nodeId: string; name: string; isEndNode: boolean; href: string; }
interface MatchedProduct {
  tecdocCode: string; tecdocBrand: string; tecdocName: string; genArtID: number | null;
  product: { id?: string; name?: string; product_code?: string; brand?: string; image_url?: string; } | null;
  nextisPrice: number | null;
  nextisPriceVAT: number | null;
  nextisQty: number | null;
  nextisDiscount: number | null;
  criteria?: Array<{ key: string; value: string }>;
  imageUrl?: string;
}

interface DynamicFilter { key: string; values: string[]; }

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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [productView, setProductView] = useState<"list" | "grid">("list");
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [tecdocCount, setTecdocCount] = useState(0);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
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
      // Load first page of products for leaf category
      setLoadingProducts(true); setCurrentPage(1); setHasMore(false); setProducts([]); setCategories([]); setDynamicFilters([]); setActiveFilters({});
      fetch(`/api/vehicles?action=products&engineId=${engineId}&categoryId=${leafParam}&bs=${brandSlug}&ms=${modelSlug}&es=${engineSlug}&bi=${brandId}&mi=${modelId}&page=1`)
        .then((r) => r.json())
        .then((data) => { setProducts(data.products || []); setTecdocCount(data.tecdocCount || 0); setHasMore(!!data.hasMore); setCurrentPage(1); if (data.filters) setDynamicFilters(data.filters); })
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

  async function handleCategoryClick(cat: Category) {
    // Handle promoted subcategories (e.g. "Brzdové obložení" promoted from "Kotoučová brzda")
    if (cat.nodeId.startsWith("promoted_")) {
      const parts = cat.nodeId.split("_"); // promoted_{parentNodeId}_{subName}
      const parentId = parts[1];
      const subName = cat.name.toLowerCase();
      // Fetch subcategories of parent to find real nodeId
      try {
        const res = await fetch(`/api/vehicles?action=categories&engineId=${engineId}&parentId=${parentId}`);
        const subs: Category[] = await res.json();
        const real = subs.find((s: Category) => s.name.toLowerCase().includes(subName));
        if (real) {
          const parentCat = categories.find(c => c.nodeId === parentId);
          const parentPath = parentCat ? `${parentCat.nodeId}:${parentCat.name}~` : "";
          const path = catPathParam ? `${catPathParam}~${parentPath}${real.nodeId}:${real.name}` : `${parentPath}${real.nodeId}:${real.name}`;
          if (real.isEndNode) {
            router.push(vehicleUrl({ cat: "", catPath: path, leaf: real.nodeId }));
          } else {
            router.push(vehicleUrl({ cat: real.nodeId, catPath: path, leaf: "" }));
          }
          return;
        }
      } catch {}
    }

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

  function loadMoreProducts() {
    if (loadingMore || !hasMore || !leafParam) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    fetch(`/api/vehicles?action=products&engineId=${engineId}&categoryId=${leafParam}&bs=${brandSlug}&ms=${modelSlug}&es=${engineSlug}&bi=${brandId}&mi=${modelId}&page=${nextPage}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts((prev) => [...prev, ...(data.products || [])]);
        setTecdocCount((prev) => prev + (data.tecdocCount || 0));
        setHasMore(!!data.hasMore);
        setCurrentPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  const showBrakeSchematic = !loading && categories.length > 0 && breadcrumb.some((b) => b.name.toLowerCase().includes("brzd"));
  const showFilterSchematic = !loading && categories.length > 0 && breadcrumb.some((b) => b.name.toLowerCase().includes("filtr"));
  const showRightSchematic = showBrakeSchematic || showFilterSchematic;
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


          {/* Categories */}
          {!loading && categories.length > 0 && (() => {
            // Promote key subcategories to main level (e.g. Brzdové obložení from Kotoučová brzda)
            const PROMOTE_MAP: Record<string, string[]> = {
              "kotoučová brzda": ["brzdové obložení", "brzdový kotouč"],
            };
            const promoted: Category[] = [];
            for (const cat of categories) {
              const key = cat.name.toLowerCase();
              if (PROMOTE_MAP[key]) {
                // This is a GROUP whose children should be promoted
                for (const subName of PROMOTE_MAP[key]) {
                  // Create a virtual promoted category — will be resolved on click via subcats fetch
                  promoted.push({
                    nodeId: `promoted_${cat.nodeId}_${subName.replace(/\s/g, "_")}`,
                    name: subName.charAt(0).toUpperCase() + subName.slice(1),
                    isEndNode: true, // Will search as leaf
                    href: "",
                  });
                }
              }
            }
            // Hide certain subcategories from brake view
            const HIDE_FROM_BRAKE = ["simulátor pocitu", "filtr"];
            const isBrakeView = breadcrumb.some(b => b.name.toLowerCase().includes("brzd"));
            const filteredCats = isBrakeView
              ? categories.filter(c => !HIDE_FROM_BRAKE.some(h => c.name.toLowerCase().startsWith(h)))
              : categories;
            const allCategories = [...promoted, ...filteredCats];

            // Priority order for categories
            const PRIORITY_ORDER = [
              "brzd", "motor", "filtr", "řemen", "spojk", "řízen", "rizen", "odpruž", "tlumen",
              "chlaz", "výfuk", "vyfuk", "paliv", "elektro", "zapalov", "klima", "zavěšen",
              "náprav", "pohon", "převod", "karos", "topen", "servis", "kontrol",
            ];
            function getPriority(name: string): number {
              const l = name.toLowerCase();
              for (let i = 0; i < PRIORITY_ORDER.length; i++) {
                if (l.includes(PRIORITY_ORDER[i])) return i;
              }
              return 999;
            }

            const sorted = [...allCategories].sort((a, b) => getPriority(a.name) - getPriority(b.name));
            const top8 = sorted.slice(0, 8);
            const rest = sorted.slice(8);

            return (
              <>
                {/* Top categories — large cards */}
                {top8.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {top8.map((cat) => {
                      const image = getCategoryImage(cat.name);
                      const style = getCategoryStyle(cat.name);
                      return (
                        <button
                          key={cat.nodeId}
                          onClick={() => handleCategoryClick(cat)}
                          onMouseEnter={() => setHoveredCatId(cat.nodeId)}
                          onMouseLeave={() => setHoveredCatId(null)}
                          className="group bg-white rounded-xl border border-mlborder-light hover:border-primary/30 hover:shadow-lg transition-all p-4 flex flex-col items-center gap-3 hover:-translate-y-0.5"
                        >
                          <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {image ? (
                              <img src={image} alt="" className="w-full h-full object-contain" loading="lazy" />
                            ) : (
                              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke={style.color} strokeWidth="1.5"><path d={style.icon} /></svg>
                            )}
                          </div>
                          <div className="text-center">
                            <span className="block text-[13px] font-bold text-mltext-dark group-hover:text-primary transition-colors leading-tight">{cat.name}</span>
                            <span className="block text-[10px] text-mltext-light mt-0.5">{cat.isEndNode ? "Zobrazit díly" : "Podkategorie →"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Rest — compact rows */}
                {rest.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-mltext-light uppercase tracking-wider mb-2">Další kategorie</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mb-4">
                      {rest.map((cat) => {
                        const style = getCategoryStyle(cat.name);
                        const image = getCategoryImage(cat.name);
                        return (
                          <button
                            key={cat.nodeId}
                            onClick={() => handleCategoryClick(cat)}
                            onMouseEnter={() => setHoveredCatId(cat.nodeId)}
                            onMouseLeave={() => setHoveredCatId(null)}
                            className="group text-left bg-white rounded-xl border border-mlborder-light hover:border-primary/30 hover:bg-primary/[0.02] transition-all px-4 py-3 flex items-center gap-3"
                          >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: style.color + "40", border: `2px solid ${style.color}` }} />
                            <span className="flex-1 text-[13px] font-semibold text-mltext group-hover:text-primary transition-colors truncate">
                              {cat.name}
                            </span>
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlborder-light group-hover:text-primary shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            );
          })()}

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
          {!loadingProducts && products.length > 0 && (() => {
            // Apply client-side filters from criteria
            const filteredProducts = products.filter((p) => {
              if (Object.keys(activeFilters).length === 0) return true;
              if (!p.criteria) return true;
              for (const [filterKey, filterValue] of Object.entries(activeFilters)) {
                const match = p.criteria.find((c) => c.key === filterKey && c.value === filterValue);
                if (!match) return false;
              }
              return true;
            });

            return (
            <>
              {/* Dynamic TecDoc filters */}
              {dynamicFilters.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  {dynamicFilters.map((f) => (
                    <div key={f.key} className="relative group">
                      <button className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        activeFilters[f.key] ? "bg-primary/10 border-primary/30 text-primary" : "bg-white border-mlborder-light text-mltext hover:border-mlborder"
                      }`}>
                        {f.key}{activeFilters[f.key] ? `: ${activeFilters[f.key]}` : ""}
                        <svg viewBox="0 0 24 24" className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-mlborder-light shadow-xl py-1 min-w-[160px] z-20 hidden group-hover:block">
                        <button
                          onClick={() => { const next = { ...activeFilters }; delete next[f.key]; setActiveFilters(next); }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${!activeFilters[f.key] ? "text-primary bg-primary/5" : "text-mltext-light hover:bg-gray-50"}`}
                        >
                          Vše
                        </button>
                        {f.values.map((v) => (
                          <button
                            key={v}
                            onClick={() => setActiveFilters({ ...activeFilters, [f.key]: v })}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${activeFilters[f.key] === v ? "text-primary bg-primary/5" : "text-mltext hover:bg-gray-50"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(activeFilters).length > 0 && (
                    <button onClick={() => setActiveFilters({})} className="text-[11px] text-primary hover:text-primary-dark font-semibold">
                      Zrušit filtry ✕
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-mltext-light">
                  <span className="font-bold text-mltext-dark">{Object.keys(activeFilters).length > 0 ? filteredProducts.length + " z " + tecdocCount : tecdocCount}</span> dílů
                  {products.filter((p) => p.product).length > 0 && (
                    <> — <span className="font-bold text-mlgreen">{products.filter((p) => p.product).length}</span> v našem skladu</>
                  )}
                </p>
                {/* View toggle */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setProductView("list")} className={`p-1.5 rounded-md transition-all ${productView === "list" ? "bg-white shadow-sm text-mltext-dark" : "text-mltext-light hover:text-mltext"}`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                  </button>
                  <button onClick={() => setProductView("grid")} className={`p-1.5 rounded-md transition-all ${productView === "grid" ? "bg-white shadow-sm text-mltext-dark" : "text-mltext-light hover:text-mltext"}`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  </button>
                </div>
              </div>

              <div className={productView === "grid" ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "space-y-2"}>
                {filteredProducts.map((item, i) => {
                  const montovanaStrana = item.criteria?.find((c) => c.key.toLowerCase().includes("montovaná strana") || c.key.toLowerCase().includes("provedení nápravy"));
                  const detailUrl = item.product?.id ? `/product/${item.product.id}` : `/search?q=${encodeURIComponent(item.tecdocCode)}`;
                  const inStock = (item.nextisQty || 0) > 0;

                  /* ─── GRID VIEW ─── */
                  if (productView === "grid") return (
                    <div key={i} className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${inStock ? "border-mlgreen/20" : "border-mlborder-light"}`}>
                      <a href={detailUrl} className="block aspect-[4/3] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-3 relative">
                        <ProductThumb imageUrl={item.product?.image_url as string} productId={item.product?.id as string} productCode={item.tecdocCode} brand={item.tecdocBrand} />
                        {inStock && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-white bg-mlgreen px-1.5 py-0.5 rounded">Skladem</span>}
                      </a>
                      <div className="p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {hasManufacturerLogo(item.tecdocBrand) && <img src={getManufacturerLogoUrl(item.tecdocBrand)} alt="" className="h-3 w-auto object-contain" loading="lazy" />}
                          <span className="text-[9px] text-mltext-light font-bold uppercase">{item.tecdocBrand}</span>
                          <span className="text-[9px] font-mono text-primary/40">{item.tecdocCode}</span>
                        </div>
                        <a href={detailUrl} className="block text-[12px] font-bold text-mltext-dark hover:text-primary transition-colors leading-tight line-clamp-2">
                          {item.product?.name || item.tecdocName || item.tecdocCode}
                        </a>
                        {/* Key specs */}
                        {montovanaStrana && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{montovanaStrana.value}</span>
                        )}
                        {item.criteria && item.criteria.filter((c) => c !== montovanaStrana).length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {item.criteria.filter((c) => c !== montovanaStrana).slice(0, 3).map((c, ci) => (
                              <span key={ci} className="text-[8px] text-mltext-light bg-gray-50 px-1 py-0.5 rounded">{c.key}: <span className="font-semibold">{c.value}</span></span>
                            ))}
                          </div>
                        )}
                        {/* Price + cart */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-mlborder-light">
                          {item.nextisPrice ? (
                            <span className="text-[15px] font-extrabold text-mltext-dark">{item.nextisPrice.toFixed(0)} <span className="text-[10px] text-mltext-light">Kč</span></span>
                          ) : <span className="text-[11px] text-mltext-light">Na dotaz</span>}
                          <button onClick={() => cart.addItem({ id: item.product?.id as string || item.tecdocCode, productCode: item.tecdocCode, brand: item.tecdocBrand, name: item.product?.name as string || item.tecdocName, price: item.nextisPrice || 0, imageUrl: item.product?.image_url as string || "", qty: 1 })}
                            className="bg-primary hover:bg-primary-dark text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors">
                            Do košíku
                          </button>
                        </div>
                      </div>
                    </div>
                  );

                  /* ─── LIST VIEW ─── */
                  return (
                  <div
                    key={i}
                    className={`bg-white rounded-xl border p-4 flex gap-5 items-center transition-all hover:shadow-md ${inStock ? "border-mlgreen/20" : "border-mlborder-light"}`}
                  >
                    <a href={detailUrl} className="w-28 h-24 rounded-lg bg-gray-50 border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden hover:border-primary/20 transition-colors p-1">
                      <ProductThumb
                        imageUrl={item.product?.image_url as string}
                        productId={item.product?.id as string}
                        productCode={item.tecdocCode}
                        brand={item.tecdocBrand}
                      />
                    </a>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Brand + code */}
                      <div className="flex items-center gap-2 mb-0.5">
                        {hasManufacturerLogo(item.tecdocBrand) && (
                          <img src={getManufacturerLogoUrl(item.tecdocBrand)} alt="" className="h-3.5 w-auto object-contain" loading="lazy" />
                        )}
                        <span className="text-[11px] text-mltext-light font-bold uppercase">{item.tecdocBrand}</span>
                        <span className="text-[11px] font-mono text-primary/50">{item.tecdocCode}</span>
                      </div>
                      {/* Name */}
                      <a href={detailUrl} className="block text-[14px] font-bold text-mltext-dark hover:text-primary transition-colors leading-tight truncate">
                        {item.product?.name || item.tecdocName || item.tecdocCode}
                      </a>
                      {/* Montovaná strana — highlighted */}
                      {montovanaStrana && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                          {montovanaStrana.value}
                        </span>
                      )}
                      {/* Other specs */}
                      {item.criteria && item.criteria.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.criteria.filter((c) => c !== montovanaStrana).slice(0, 5).map((c, ci) => (
                            <span key={ci} className="text-[10px] text-mltext-light bg-gray-50 px-1.5 py-0.5 rounded">
                              {c.key}: <span className="font-semibold text-mltext">{c.value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Stock + Detail */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[11px] font-bold ${inStock ? "text-mlgreen" : "text-mlorange"}`}>
                          {inStock ? `Skladem ${item.nextisQty} ks` : "Na objednávku"}
                        </span>
                        <a href={detailUrl} className="text-[11px] text-primary hover:text-primary-dark font-semibold">Detail →</a>
                      </div>
                    </div>

                    {/* Price + Cart */}
                    <div className="flex flex-col items-end gap-2 shrink-0 min-w-[100px]">
                      {item.nextisPrice ? (
                        <>
                          <div className="text-right">
                            <p className="text-xl font-extrabold text-mltext-dark leading-none">
                              {item.nextisPrice.toFixed(0)}
                              <span className="text-sm font-bold text-mltext-light ml-0.5">Kč</span>
                            </p>
                            {item.nextisPriceVAT && (
                              <p className="text-[10px] text-mltext-light">{item.nextisPriceVAT.toFixed(0)} Kč s DPH</p>
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
                  );
                })}
              </div>

              {/* Show more button — fetches next page from API */}
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={loadMoreProducts}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 bg-white border-2 border-mlborder hover:border-primary/30 text-mltext-dark font-bold text-sm px-8 py-3 rounded-xl transition-all hover:shadow-md disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-mlborder-light border-t-primary" />
                        Načítám...
                      </>
                    ) : (
                      <>
                        Zobrazit další
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          );
          })()}
          </div>
        </div>

        {/* RIGHT — Expandable schematic sidebar */}
        {showRightSchematic && (
          <SchematicSidebar
            showBrake={showBrakeSchematic}
            showFilter={showFilterSchematic}
            categories={categories}
            onSelect={handleCategoryClick}
            engineId={String(engineId)}
            hoveredCategoryId={hoveredCatId}
          />
        )}
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

