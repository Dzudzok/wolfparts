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
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [expandedFilterKeys, setExpandedFilterKeys] = useState<Set<string>>(new Set());
  const [productView, setProductView] = useState<"list" | "grid">("list");
  const [loading, setLoading] = useState(!leafParam);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [allCatsFlat, setAllCatsFlat] = useState<{ nodeId: string; name: string; parentNodeId?: number; parentName?: string; isEndNode: boolean }[]>([]);
  const [allCatsLoaded, setAllCatsLoaded] = useState(false);
  const [tecdocCount, setTecdocCount] = useState(0);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<{ imageUrl?: string; power?: string; engineCodes?: string; fuel?: string; years?: string; body?: string } | null>(null);

  // Filtered products (reacts to filter changes)
  const filteredProducts = useMemo(() => {
    const hasActive = Object.keys(activeFilters).length > 0;
    if (!hasActive) return products;
    return products.filter((p) => {
      for (const [filterKey, filterValues] of Object.entries(activeFilters)) {
        if (filterValues.length === 0) continue;
        if (filterKey === "Výrobce") {
          if (!filterValues.includes(p.tecdocBrand)) return false;
          continue;
        }
        if (!p.criteria) return false;
        if (!p.criteria.find((c) => c.key === filterKey && filterValues.includes(c.value))) return false;
      }
      return true;
    });
  }, [products, activeFilters]);

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
      // Load all products for leaf category — check localStorage cache first
      const cacheKey = `wp_products_${engineId}_${leafParam}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 min

      function applyData(data: { products?: MatchedProduct[]; tecdocCount?: number; filters?: DynamicFilter[] }) {
        const all: MatchedProduct[] = data.products || [];
        setProducts(all);
        setTecdocCount(data.tecdocCount || all.length);
        setDynamicFilters(data.filters || []);
      }

      setLoading(false); setShowFilterSidebar(true); setCategories([]); setActiveFilters({});

      // Try cache
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - cached.ts < CACHE_TTL) {
            applyData(cached.data);
            setLoadingProducts(false);
            return;
          }
          localStorage.removeItem(cacheKey);
        }
      } catch {}

      // No cache — fetch from API
      setLoadingProducts(true); setProducts([]); setDynamicFilters([]);
      const url = `/api/vehicles?action=products&engineId=${engineId}&categoryId=${leafParam}&bs=${brandSlug}&ms=${modelSlug}&es=${engineSlug}&bi=${brandId}&mi=${modelId}`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          applyData(data);
          // Save to localStorage cache
          try { localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}
        })
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false));
    } else {
      // Load categories
      setProducts([]); setDynamicFilters([]); setActiveFilters({}); setTecdocCount(0); setLoadingProducts(false); setShowFilterSidebar(false);
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
            {/* Category search */}
            <div className="px-3 mb-2">
              <div className="relative">
                <svg viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mltext-light/50" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    // Lazy-load all categories on first keystroke
                    if (e.target.value && !allCatsLoaded) {
                      setAllCatsLoaded(true);
                      fetch(`/api/vehicles?action=categories&engineId=${engineId}&parentId=-1`)
                        .then((r) => r.json())
                        .then((d) => { if (Array.isArray(d)) setAllCatsFlat(d); })
                        .catch(() => {});
                    }
                  }}
                  placeholder="Hledat kategorii..."
                  className="w-full text-[12px] font-medium text-mltext-dark placeholder:text-mltext-light/50 bg-gray-50 border border-mlborder-light rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                />
                {catSearch && (
                  <button onClick={() => setCatSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-mltext-light hover:text-mltext transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Search results across all categories */}
            {catSearch.trim() && allCatsFlat.length > 0 ? (
              <div>
                <p className="px-4 text-[10px] font-bold text-mltext-light uppercase tracking-wider mb-2">
                  Výsledky hledání
                </p>
                {(() => {
                  const q = catSearch.trim().toLowerCase();
                  const results = allCatsFlat.filter((c) => c.name.toLowerCase().includes(q));
                  if (results.length === 0) return (
                    <p className="px-4 py-3 text-[12px] text-mltext-light">Nic nenalezeno</p>
                  );
                  return results.slice(0, 20).map((cat) => {
                    // Find parent chain for navigation
                    const parentCat = cat.parentNodeId ? allCatsFlat.find((c) => String(c.nodeId) === String(cat.parentNodeId)) : null;
                    return (
                      <button
                        key={cat.nodeId}
                        onClick={() => {
                          let path = "";
                          if (parentCat) {
                            // Check if parentCat also has a parent
                            const grandParent = parentCat.parentNodeId ? allCatsFlat.find((c) => String(c.nodeId) === String(parentCat.parentNodeId)) : null;
                            if (grandParent) {
                              path = `${grandParent.nodeId}:${grandParent.name}~${parentCat.nodeId}:${parentCat.name}~${cat.nodeId}:${cat.name}`;
                            } else {
                              path = `${parentCat.nodeId}:${parentCat.name}~${cat.nodeId}:${cat.name}`;
                            }
                          } else {
                            path = `${cat.nodeId}:${cat.name}`;
                          }
                          setCatSearch("");
                          if (cat.isEndNode) {
                            router.push(vehicleUrl({ cat: "", catPath: path, leaf: cat.nodeId }));
                          } else {
                            router.push(vehicleUrl({ cat: cat.nodeId, catPath: path, leaf: "" }));
                          }
                        }}
                        className="w-full flex flex-col px-4 py-2 text-left hover:bg-primary/[0.04] transition-colors border-b border-mlborder-light/50 last:border-0"
                      >
                        <span className="text-[13px] font-semibold text-mltext-dark">{cat.name}</span>
                        {cat.parentName && (
                          <span className="text-[10px] text-mltext-light">{cat.parentName}</span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </aside>

        {/* FILTER SIDEBAR — collapsible with edge arrow */}
        {showFilterSidebar && (
          <div className="hidden lg:flex shrink-0 relative" style={{ position: "sticky", top: "64px", maxHeight: "calc(100vh - 64px)", alignSelf: "flex-start" }}>
            {/* Sidebar content — slides in/out */}
            <aside
              className="border-r border-mlborder-light bg-white overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
              style={{ width: filterSidebarCollapsed ? "0px" : "224px", opacity: filterSidebarCollapsed ? 0 : 1 }}
            >
              <div className="py-3 w-56">
                <p className="px-4 text-[10px] font-bold text-mltext-light uppercase tracking-wider mb-2">Filtry</p>
                {loadingProducts ? (
                  <div className="px-4 space-y-4 animate-pulse">
                    {[1,2,3,4].map((i) => (
                      <div key={i}>
                        <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                        <div className="space-y-2">
                          <div className="h-3 w-32 bg-gray-100 rounded" />
                          <div className="h-3 w-28 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {Object.keys(activeFilters).length > 0 && (
                      <button onClick={() => setActiveFilters({})} className="mx-4 mb-2 text-[11px] text-primary hover:text-primary-dark font-bold flex items-center gap-1">
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        Zrušit vše
                      </button>
                    )}
                    {dynamicFilters.map((f) => {
                      const selected = activeFilters[f.key] || [];
                      const isExpanded = expandedFilterKeys.has(f.key);
                      const LIMIT = 10;
                      const visibleValues = isExpanded ? f.values : f.values.slice(0, LIMIT);
                      const hasMore = f.values.length > LIMIT;
                      const otherFiltered = products.filter((p) => {
                        for (const [fk, fv] of Object.entries(activeFilters)) {
                          if (fk === f.key || fv.length === 0) continue;
                          if (fk === "Výrobce") { if (!fv.includes(p.tecdocBrand)) return false; continue; }
                          if (!p.criteria?.find((c) => c.key === fk && fv.includes(c.value))) return false;
                        }
                        return true;
                      });
                      return (
                        <details key={f.key} className="group" open>
                          <summary className="flex items-center justify-between px-4 py-1.5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                            <span className="text-[12px] font-bold text-mltext-dark">{f.key}</span>
                            <svg viewBox="0 0 24 24" className="w-3 h-3 text-mltext-light/40 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                          </summary>
                          <div className="px-4 pb-2">
                            {visibleValues.map((v) => {
                              const isActive = selected.includes(v);
                              const count = f.key === "Výrobce"
                                ? otherFiltered.filter((p) => p.tecdocBrand === v).length
                                : otherFiltered.filter((p) => p.criteria?.some((c) => c.key === f.key && c.value === v)).length;
                              return (
                                <label key={v} className="flex items-center gap-2 py-1 cursor-pointer group/item hover:text-primary transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => {
                                      setActiveFilters((prev) => {
                                        const current = prev[f.key] || [];
                                        const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
                                        if (next.length === 0) { const { [f.key]: _, ...rest } = prev; return rest; }
                                        return { ...prev, [f.key]: next };
                                      });
                                    }}
                                    className="w-3.5 h-3.5 rounded border-mlborder accent-primary cursor-pointer"
                                  />
                                  <span className="text-[11px] text-mltext group-hover/item:text-primary flex-1 leading-tight">{v}</span>
                                  <span className="text-[10px] text-mltext-light">{count}</span>
                                </label>
                              );
                            })}
                            {hasMore && (
                              <button
                                onClick={() => setExpandedFilterKeys((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(f.key)) next.delete(f.key); else next.add(f.key);
                                  return next;
                                })}
                                className="text-[10px] text-primary hover:text-primary-dark font-bold mt-1"
                              >
                                {isExpanded ? "Zobrazit méně ▲" : `Zobrazit vše (${f.values.length}) ▼`}
                              </button>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </>
                )}
              </div>
            </aside>

          </div>
        )}

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

          {/* Loading — categories */}
          {loading && !loadingProducts && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-mlborder-light border-t-primary mb-4" />
              <span className="text-mltext-light text-sm font-medium">Načítám kategorie...</span>
            </div>
          )}

          {/* Loading — products skeleton */}
          {loadingProducts && (
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-24 bg-gray-100 rounded-full" />
              </div>
              <div className="space-y-3">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-mlborder-light p-4 flex gap-5 items-center">
                    <div className="w-32 h-28 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-16 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="flex gap-1.5">
                        <div className="h-3 w-20 bg-gray-50 rounded-full" />
                        <div className="h-3 w-24 bg-gray-50 rounded-full" />
                        <div className="h-3 w-16 bg-gray-50 rounded-full" />
                      </div>
                      <div className="h-4 w-20 bg-green-50 rounded-full" />
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="h-7 w-16 bg-gray-200 rounded" />
                      <div className="h-9 w-24 bg-primary/20 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
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
            const hasActiveFilters = Object.keys(activeFilters).length > 0;

            const inStockCount = products.filter((p) => (p.nextisQty || 0) > 0).length;

            // Check if this is a brake category with montovaná strana filter
            const isBrakeCategory = breadcrumb.some((b) => b.name.toLowerCase().includes("brzd"));
            const stranaFilter = dynamicFilters.find((f) => f.key.toLowerCase().includes("montovaná strana"));
            const stranaKey = stranaFilter?.key || "";
            const activeStrana = activeFilters[stranaKey] || [];

            // Map values to front/rear
            const frontValues = stranaFilter?.values.filter((v) => /přední|front/i.test(v)) || [];
            const rearValues = stranaFilter?.values.filter((v) => /zadní|rear/i.test(v)) || [];
            const hasFrontRear = isBrakeCategory && stranaFilter && (frontValues.length > 0 || rearValues.length > 0);
            const isFrontActive = frontValues.some((v) => activeStrana.includes(v));
            const isRearActive = rearValues.some((v) => activeStrana.includes(v));

            function toggleStrana(values: string[]) {
              if (values.length === 0) return;
              setActiveFilters((prev) => {
                const current = prev[stranaKey] || [];
                const isActive = values.some((v) => current.includes(v));
                if (isActive) {
                  const next = current.filter((v) => !values.includes(v));
                  if (next.length === 0) { const { [stranaKey]: _, ...rest } = prev; return rest; }
                  return { ...prev, [stranaKey]: next };
                }
                return { ...prev, [stranaKey]: [...current, ...values] };
              });
            }

            return (
            <>
              {/* ── Visual front/rear brake filter ── */}
              {hasFrontRear && (
                <div className="mb-5 bg-white rounded-2xl border border-mlborder-light p-4 flex items-center justify-center gap-6">
                  <p className="text-[11px] font-bold text-mltext-light uppercase tracking-wider">Náprava:</p>
                  <div className="flex items-center gap-3">
                    {/* Car SVG with clickable front/rear */}
                    <svg viewBox="0 0 280 100" className="w-[240px] h-[86px]" xmlns="http://www.w3.org/2000/svg">
                      {/* Car body */}
                      <path d="M60,55 Q60,35 85,30 L120,25 Q140,18 170,18 L200,22 Q220,28 225,35 Q240,40 245,55 L245,65 Q245,70 240,70 L55,70 Q50,70 50,65 Z" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
                      {/* Windows */}
                      <path d="M115,28 L125,22 Q140,20 168,20 L195,24 Q210,28 215,35 L115,35 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5"/>
                      {/* Front wheel area - clickable */}
                      <g className="cursor-pointer" onClick={() => toggleStrana(frontValues)} role="button">
                        <rect x="55" y="42" width="55" height="38" rx="4" fill={isFrontActive ? "rgba(232,25,44,0.12)" : "transparent"} stroke={isFrontActive ? "#E8192C" : "transparent"} strokeWidth="1.5" />
                        <circle cx="82" cy="68" r="16" fill={isFrontActive ? "#E8192C" : "#9ca3af"} opacity={isFrontActive ? 1 : 0.4} className="transition-all"/>
                        <circle cx="82" cy="68" r="10" fill={isFrontActive ? "#fca5a5" : "#d1d5db"} className="transition-all"/>
                        <circle cx="82" cy="68" r="4" fill={isFrontActive ? "#E8192C" : "#9ca3af"} className="transition-all"/>
                      </g>
                      {/* Rear wheel area - clickable */}
                      <g className="cursor-pointer" onClick={() => toggleStrana(rearValues)} role="button">
                        <rect x="180" y="42" width="55" height="38" rx="4" fill={isRearActive ? "rgba(232,25,44,0.12)" : "transparent"} stroke={isRearActive ? "#E8192C" : "transparent"} strokeWidth="1.5" />
                        <circle cx="207" cy="68" r="16" fill={isRearActive ? "#E8192C" : "#9ca3af"} opacity={isRearActive ? 1 : 0.4} className="transition-all"/>
                        <circle cx="207" cy="68" r="10" fill={isRearActive ? "#fca5a5" : "#d1d5db"} className="transition-all"/>
                        <circle cx="207" cy="68" r="4" fill={isRearActive ? "#E8192C" : "#9ca3af"} className="transition-all"/>
                      </g>
                      {/* Direction arrow */}
                      <path d="M42,55 L50,50 L50,60 Z" fill="#d1d5db"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => toggleStrana(frontValues)}
                      className={`text-[12px] font-bold px-4 py-1.5 rounded-lg border transition-all ${isFrontActive ? "bg-primary text-white border-primary" : "bg-white text-mltext border-mlborder-light hover:border-primary/40 hover:text-primary"}`}
                    >
                      Přední náprava
                    </button>
                    <button
                      onClick={() => toggleStrana(rearValues)}
                      className={`text-[12px] font-bold px-4 py-1.5 rounded-lg border transition-all ${isRearActive ? "bg-primary text-white border-primary" : "bg-white text-mltext border-mlborder-light hover:border-primary/40 hover:text-primary"}`}
                    >
                      Zadní náprava
                    </button>
                  </div>
                </div>
              )}

              {/* ── Results header ── */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Filter toggle — prominent button */}
                  <button
                    onClick={() => setFilterSidebarCollapsed((prev) => !prev)}
                    className={`hidden lg:flex items-center gap-2 text-[13px] font-bold pl-3 pr-3.5 py-2 rounded-xl border-2 transition-all ${
                      filterSidebarCollapsed
                        ? "text-primary border-primary/30 bg-primary/[0.05] hover:bg-primary/10 hover:border-primary/50"
                        : "text-mltext border-mlborder hover:border-mltext-light hover:bg-gray-50"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filtry
                    {Object.keys(activeFilters).length > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center -mr-0.5">{Object.keys(activeFilters).length}</span>
                    )}
                    <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${filterSidebarCollapsed ? "rotate-90" : "-rotate-90"}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <p className="text-sm text-mltext-light">
                    <span className="font-bold text-mltext-dark text-base">{hasActiveFilters ? filteredProducts.length : tecdocCount}</span>
                    {hasActiveFilters && <span className="text-mltext-light"> z {tecdocCount}</span>} dílů
                  </p>
                  {inStockCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-mlgreen bg-mlgreen/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-mlgreen" />
                      {inStockCount} skladem
                    </span>
                  )}
                </div>
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

              {/* ── Inline Výrobce filter (always visible) ── */}
              {(() => {
                const vyrobceFilter = dynamicFilters.find((f) => f.key === "Výrobce");
                if (!vyrobceFilter || vyrobceFilter.values.length < 1) return null;
                const selectedBrands = activeFilters["Výrobce"] || [];

                // Compute counts & sort by count desc
                const brandCounts = vyrobceFilter.values.map((brand) => {
                  const count = products.filter((p) => {
                    for (const [fk, fv] of Object.entries(activeFilters)) {
                      if (fk === "Výrobce" || fv.length === 0) continue;
                      if (!p.criteria?.find((c) => c.key === fk && fv.includes(c.value))) return false;
                    }
                    return p.tecdocBrand === brand;
                  }).length;
                  return { brand, count, isActive: selectedBrands.includes(brand) };
                }).sort((a, b) => {
                  // Active first, then by count desc
                  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                  return b.count - a.count;
                });

                const TOP_LIMIT = 20;
                const topBrands = brandCounts.slice(0, TOP_LIMIT);
                const moreBrands = brandCounts.slice(TOP_LIMIT);
                // Always show active brands even if outside top
                const activeOutside = moreBrands.filter((b) => b.isActive);
                const visibleBrands = [...topBrands, ...activeOutside];
                const hiddenBrands = moreBrands.filter((b) => !b.isActive);

                const toggleBrand = (brand: string) => {
                  setActiveFilters((prev) => {
                    const current = prev["Výrobce"] || [];
                    const next = current.includes(brand) ? current.filter((x) => x !== brand) : [...current, brand];
                    if (next.length === 0) { const { "Výrobce": _, ...rest } = prev; return rest; }
                    return { ...prev, "Výrobce": next };
                  });
                };

                const BrandChip = ({ b }: { b: { brand: string; count: number; isActive: boolean } }) => (
                  <button
                    onClick={() => toggleBrand(b.brand)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      b.isActive
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-mltext-dark border-mlborder-light hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {b.brand}
                    <span className={`text-[9px] ${b.isActive ? "text-white/70" : "text-mltext-light"}`}>{b.count}</span>
                    {b.isActive && (
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    )}
                  </button>
                );

                return (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {visibleBrands.map((b) => <BrandChip key={b.brand} b={b} />)}

                      {hiddenBrands.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() => setShowAllBrands((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/[0.06] hover:bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 transition-all"
                          >
                            +{hiddenBrands.length}
                            <svg viewBox="0 0 24 24" className={`w-3 h-3 transition-transform ${showAllBrands ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                          </button>

                          {showAllBrands && (
                            <>
                              {/* Backdrop */}
                              <div className="fixed inset-0 z-10" onClick={() => setShowAllBrands(false)} />
                              {/* Dropdown */}
                              <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-mlborder shadow-xl p-3 min-w-[280px] max-h-[240px] overflow-y-auto">
                                <div className="flex flex-wrap gap-1.5">
                                  {hiddenBrands.map((b) => <BrandChip key={b.brand} b={b} />)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {selectedBrands.length > 0 && (
                        <button
                          onClick={() => { setActiveFilters((prev) => { const { "Výrobce": _, ...rest } = prev; return rest; }); setShowAllBrands(false); }}
                          className="text-[11px] text-primary hover:text-primary-dark font-bold ml-1 flex items-center gap-0.5"
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          Zrušit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Product list ── */}
              <div className={productView === "grid" ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "space-y-2"}>
                {filteredProducts.map((item, i) => {
                  const montovanaStrana = item.criteria?.find((c) => c.key.toLowerCase().includes("montovaná strana") || c.key.toLowerCase().includes("provedení nápravy"));
                  const detailUrl = item.product?.id ? `/product/${item.product.id}` : `/search?q=${encodeURIComponent(item.tecdocCode)}`;
                  const inStock = (item.nextisQty || 0) > 0;
                  const otherCriteria = item.criteria?.filter((c) => c !== montovanaStrana) || [];
                  const hasDiscount = item.nextisDiscount && item.nextisDiscount > 0;
                  const productName = item.product?.name || item.tecdocName || item.tecdocCode;
                  const addToCart = () => cart.addItem({ id: item.product?.id as string || item.tecdocCode, productCode: item.tecdocCode, brand: item.tecdocBrand, name: productName, price: item.nextisPrice || 0, imageUrl: item.product?.image_url as string || "", qty: 1 });

                  /* ─── GRID VIEW ─── */
                  if (productView === "grid") return (
                    <div key={i} className="group bg-white rounded-2xl border border-mlborder-light overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col">
                      <a href={detailUrl} className="block aspect-[4/3] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
                        <ProductThumb imageUrl={item.product?.image_url as string} productId={item.product?.id as string} productCode={item.tecdocCode} brand={item.tecdocBrand} />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {inStock && (
                            <span className="text-[9px] font-bold text-white bg-mlgreen px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              <span className="w-1 h-1 rounded-full bg-white" /> Skladem
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="text-[9px] font-bold text-white bg-primary px-2 py-0.5 rounded-full w-fit">-{item.nextisDiscount}%</span>
                          )}
                        </div>
                        {montovanaStrana && (
                          <span className="absolute top-2 right-2 text-[9px] font-bold text-blue-700 bg-blue-50/90 border border-blue-200 px-2 py-0.5 rounded-full">{montovanaStrana.value}</span>
                        )}
                      </a>
                      <div className="p-3 flex flex-col flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {hasManufacturerLogo(item.tecdocBrand) && <img src={getManufacturerLogoUrl(item.tecdocBrand)} alt="" className="h-3.5 w-auto object-contain" loading="lazy" />}
                          <span className="text-[10px] text-mltext-light font-bold uppercase">{item.tecdocBrand}</span>
                          <span className="text-[10px] font-mono text-mltext-light/40 ml-auto">{item.tecdocCode}</span>
                        </div>
                        <a href={detailUrl} className="block text-[13px] font-bold text-mltext-dark group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[36px]">
                          {productName}
                        </a>
                        {otherCriteria.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1.5">
                            {otherCriteria.slice(0, 2).map((c, ci) => (
                              <span key={ci} className="text-[9px] text-mltext-light bg-gray-50 px-1.5 py-0.5 rounded">{c.key}: <b className="text-mltext">{c.value}</b></span>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto pt-3 border-t border-mlborder-light mt-3">
                          <div className="flex items-end justify-between">
                            {item.nextisPrice ? (
                              <div>
                                <p className="text-[18px] font-extrabold text-mltext-dark leading-none">{item.nextisPrice.toFixed(0)} <span className="text-[10px] text-mltext-light font-bold">Kč</span></p>
                                {item.nextisPriceVAT && <p className="text-[9px] text-mltext-light">{item.nextisPriceVAT.toFixed(0)} Kč s DPH</p>}
                              </div>
                            ) : <span className="text-[11px] text-mltext-light">Na dotaz</span>}
                            <button onClick={addToCart} className="bg-primary hover:bg-primary-dark text-white p-2 rounded-xl transition-colors shadow-sm hover:shadow-md">
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  /* ─── LIST VIEW ─── */
                  return (
                  <div key={i} className="group bg-white rounded-2xl border border-mlborder-light hover:shadow-lg transition-all overflow-hidden">
                    <div className="flex items-stretch">
                      {/* Image */}
                      <a href={detailUrl} className="w-[180px] shrink-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-3 relative border-r border-mlborder-light">
                        <ProductThumb imageUrl={item.product?.image_url as string} productId={item.product?.id as string} productCode={item.tecdocCode} brand={item.tecdocBrand} />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {montovanaStrana && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50/90 border border-blue-200 px-2 py-0.5 rounded-full">{montovanaStrana.value}</span>
                          )}
                          {hasDiscount && (
                            <span className="text-[9px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">-{item.nextisDiscount}%</span>
                          )}
                        </div>
                      </a>

                      {/* Info + specs */}
                      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                        <div>
                          {/* Brand row */}
                          <div className="flex items-center gap-2 mb-1">
                            {hasManufacturerLogo(item.tecdocBrand) && (
                              <img src={getManufacturerLogoUrl(item.tecdocBrand)} alt="" className="h-5 w-auto object-contain" loading="lazy" />
                            )}
                            <span className="text-[11px] text-mltext-light font-bold uppercase tracking-wide">{item.tecdocBrand}</span>
                            <span className="text-[11px] font-mono text-mltext-light/40">{item.tecdocCode}</span>
                          </div>
                          {/* Name */}
                          <a href={detailUrl} className="block text-[15px] font-bold text-mltext-dark group-hover:text-primary transition-colors leading-snug">
                            {productName}
                          </a>
                          {/* Specs table */}
                          {otherCriteria.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                              {otherCriteria.slice(0, 6).map((c, ci) => (
                                <span key={ci} className="text-[11px] text-mltext-light">
                                  {c.key}: <b className="text-mltext">{c.value}</b>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Bottom row: stock + detail */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${inStock ? "text-mlgreen bg-mlgreen/10" : "text-mlorange bg-mlorange/10"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-mlgreen" : "bg-mlorange"}`} />
                            {inStock ? `Skladem ${item.nextisQty} ks` : "Na objednávku"}
                          </span>
                          <a href={detailUrl} className="text-[11px] text-primary hover:text-primary-dark font-bold">Detail →</a>
                        </div>
                      </div>

                      {/* Price + Cart */}
                      <div className="w-[160px] shrink-0 border-l border-mlborder-light bg-gray-50/50 p-4 flex flex-col items-center justify-center gap-2">
                        {item.nextisPrice ? (
                          <>
                            <div className="text-center">
                              <p className="text-[28px] font-extrabold text-mltext-dark leading-none tracking-tight">
                                {item.nextisPrice.toFixed(0)}
                                <span className="text-[13px] font-bold text-mltext-light ml-0.5">Kč</span>
                              </p>
                              {item.nextisPriceVAT && (
                                <p className="text-[10px] text-mltext-light mt-0.5">{item.nextisPriceVAT.toFixed(0)} Kč s DPH</p>
                              )}
                            </div>
                            <button onClick={addToCart}
                              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md w-full"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                              Do košíku
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-mltext-light">Na dotaz</p>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* No results after filtering */}
              {filteredProducts.length === 0 && hasActiveFilters && (
                <div className="text-center py-12 bg-white rounded-2xl border border-mlborder-light">
                  <p className="text-mltext-light text-sm">Žádné díly neodpovídají vybraným filtrům.</p>
                  <button onClick={() => setActiveFilters({})} className="mt-2 text-primary hover:text-primary-dark text-sm font-bold">Zrušit filtry</button>
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

