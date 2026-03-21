"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SearchBox from "@/components/SearchBox";

interface Category {
  nodeId: string;
  name: string;
  isEndNode: boolean;
  href: string;
}

interface MatchedProduct {
  tecdocCode: string;
  tecdocBrand: string;
  tecdocName: string;
  genArtID: number | null;
  product: {
    id?: string;
    name?: string;
    product_code?: string;
    brand?: string;
    price_min?: number;
    price_max?: number;
    in_stock?: boolean;
    stock_qty?: number;
    image_url?: string;
  } | null;
}

export default function VehiclePartsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const engineId = params.engineId as string;

  // URL params for vehicle context
  const brandSlug = searchParams.get("bs") || "";
  const modelSlug = searchParams.get("ms") || "";
  const engineSlug = searchParams.get("es") || "";
  const brandId = searchParams.get("bi") || "";
  const modelId = searchParams.get("mi") || "";
  const brandName = searchParams.get("bn") || "";
  const modelName = searchParams.get("mn") || "";
  const engineName = searchParams.get("en") || "";

  const enginePageUrl = `/cs/katalog/tecdoc/osobni/${brandSlug}/${modelSlug}/${engineSlug}/${brandId}/${modelId}/${engineId}`;

  const [categories, setCategories] = useState<Category[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Array<{ name: string; categoryId?: string }>>([]);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [tecdocCount, setTecdocCount] = useState(0);

  // Load root categories on mount
  useEffect(() => {
    if (!brandSlug) return;
    loadCategories();
  }, [engineId]);

  async function loadCategories(categoryId?: string) {
    setLoading(true);
    setProducts([]);
    try {
      const url = `/api/vehicles?action=categories&url=${encodeURIComponent(enginePageUrl)}${categoryId ? `&categoryId=${categoryId}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryClick(cat: Category) {
    if (cat.isEndNode) {
      // Load products from this leaf category
      loadProducts(cat.href, cat.name);
    } else {
      // Drill into subcategory
      setBreadcrumb((prev) => [...prev, { name: cat.name, categoryId: cat.nodeId }]);
      loadCategories(cat.nodeId);
    }
  }

  function handleBreadcrumbClick(index: number) {
    if (index < 0) {
      // Go to root
      setBreadcrumb([]);
      loadCategories();
    } else {
      const item = breadcrumb[index];
      setBreadcrumb(breadcrumb.slice(0, index + 1));
      loadCategories(item.categoryId);
    }
  }

  async function loadProducts(leafHref: string, categoryName: string) {
    setLoadingProducts(true);
    setBreadcrumb((prev) => [...prev, { name: categoryName }]);
    try {
      const res = await fetch(
        `/api/vehicles?action=products&leafHref=${encodeURIComponent(leafHref)}`
      );
      const data = await res.json();
      setProducts(data.products || []);
      setTecdocCount(data.tecdocCount || 0);
      setCategories([]);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  const vehicleLabel = [brandName, modelName, engineName].filter(Boolean).join(" / ") || `Motor ${engineId}`;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold text-gray-900 shrink-0">
            Auto<span className="text-blue-600">Dily</span>
          </a>
          <SearchBox />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Vehicle info */}
        <div className="mb-6">
          <a href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Zpet na vyhledavani
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Dily pro {vehicleLabel}
          </h1>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm mb-6 flex-wrap">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-blue-600 hover:underline"
          >
            Kategorie
          </button>
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-gray-400">/</span>
              {i < breadcrumb.length - 1 ? (
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className="text-blue-600 hover:underline"
                >
                  {item.name}
                </button>
              ) : (
                <span className="text-gray-700 font-medium">{item.name}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Loading */}
        {(loading || loadingProducts) && (
          <div className="flex items-center gap-3 py-12 justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="text-gray-500">
              {loadingProducts ? "Nacitam dily..." : "Nacitam kategorie..."}
            </span>
          </div>
        )}

        {/* Categories grid */}
        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.nodeId}
                onClick={() => handleCategoryClick(cat)}
                className="text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg px-4 py-4 transition-colors group"
              >
                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                  {cat.name}
                </span>
                {!cat.isEndNode && (
                  <span className="text-gray-400 ml-1">&rsaquo;</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No categories */}
        {!loading && categories.length === 0 && products.length === 0 && !loadingProducts && (
          <div className="text-center py-12 text-gray-500">
            {!brandSlug
              ? "Chybi parametry vozidla. Vyberte vozidlo na hlavni strance."
              : "Zadne kategorie nenalezeny."}
          </div>
        )}

        {/* Products table */}
        {!loadingProducts && products.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Nalezeno {tecdocCount} dilu v TecDoc katalogu
              {products.filter((p) => p.product).length > 0 &&
                ` — ${products.filter((p) => p.product).length} v nasem skladu`}
            </p>
            <div className="space-y-3">
              {products.map((item, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-4 flex gap-4 items-start ${
                    item.product ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
                  }`}
                >
                  {/* Image */}
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt=""
                      className="w-16 h-16 object-contain rounded bg-gray-100 shrink-0"
                      loading="lazy"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {item.product?.brand || item.tecdocBrand}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {item.tecdocCode}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.product?.name || item.tecdocName || item.tecdocCode}
                    </p>
                    {item.product ? (
                      <a
                        href={`/product/${item.product.id}`}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Zobrazit detail
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Neni v nasem skladu</p>
                    )}
                  </div>

                  {/* Price & stock */}
                  {item.product && (
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">
                        {item.product.price_min
                          ? `${item.product.price_min.toFixed(0)} Kc`
                          : "—"}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          item.product.in_stock ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {item.product.in_stock
                          ? `Skladem (${item.product.stock_qty?.toFixed(0)} ks)`
                          : "Na objednavku"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
