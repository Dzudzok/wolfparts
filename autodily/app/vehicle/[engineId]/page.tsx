"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      loadProducts(cat.href, cat.name);
    } else {
      setBreadcrumb((prev) => [...prev, { name: cat.name, categoryId: cat.nodeId }]);
      loadCategories(cat.nodeId);
    }
  }

  function handleBreadcrumbClick(index: number) {
    if (index < 0) {
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
    <div className="min-h-screen flex flex-col bg-mlbg">
      <Header />

      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Vehicle info */}
          <div className="mb-6">
            <a href="/" className="text-sm text-primary hover:text-primary-dark font-semibold">
              &larr; Zpět na vyhledávání
            </a>
            <h1 className="text-2xl font-bold text-mltext-dark mt-2">
              Díly pro {vehicleLabel}
            </h1>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm mb-6 flex-wrap">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="text-primary hover:text-primary-dark font-semibold"
            >
              Kategorie
            </button>
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-mltext-light">/</span>
                {i < breadcrumb.length - 1 ? (
                  <button
                    onClick={() => handleBreadcrumbClick(i)}
                    className="text-primary hover:text-primary-dark font-semibold"
                  >
                    {item.name}
                  </button>
                ) : (
                  <span className="text-mltext-dark font-semibold">{item.name}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Loading */}
          {(loading || loadingProducts) && (
            <div className="flex items-center gap-3 py-12 justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-mltext-light">
                {loadingProducts ? "Načítám díly..." : "Načítám kategorie..."}
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
                  className="text-left bg-white hover:bg-gray-50 border border-mlborder hover:border-primary/30 rounded px-4 py-4 transition-all group"
                >
                  <span className="text-sm font-semibold text-mltext group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                  {!cat.isEndNode && (
                    <span className="text-mltext-light ml-1">&rsaquo;</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No categories */}
          {!loading && categories.length === 0 && products.length === 0 && !loadingProducts && (
            <div className="text-center py-12 text-mltext-light">
              {!brandSlug
                ? "Chybí parametry vozidla. Vyberte vozidlo na hlavní stránce."
                : "Žádné kategorie nenalezeny."}
            </div>
          )}

          {/* Products table */}
          {!loadingProducts && products.length > 0 && (
            <>
              <p className="text-sm text-mltext-light mb-4">
                Nalezeno {tecdocCount} dílů v TecDoc katalogu
                {products.filter((p) => p.product).length > 0 &&
                  ` — ${products.filter((p) => p.product).length} v našem skladu`}
              </p>
              <div className="space-y-3">
                {products.map((item, i) => (
                  <div
                    key={i}
                    className={`border rounded px-4 py-3 flex gap-4 items-start transition-colors ${
                      item.product
                        ? "border-mlborder bg-white hover:border-primary/20"
                        : "border-mlborder-light bg-gray-50 opacity-60"
                    }`}
                  >
                    {item.product?.image_url && (
                      <img
                        src={item.product.image_url}
                        alt=""
                        className="w-16 h-16 object-contain rounded bg-gray-50 shrink-0"
                        loading="lazy"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                          {item.product?.brand || item.tecdocBrand}
                        </span>
                        <span className="text-xs font-mono text-mltext-light">
                          {item.tecdocCode}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-mltext-dark">
                        {item.product?.name || item.tecdocName || item.tecdocCode}
                      </p>
                      {item.product ? (
                        <a
                          href={`/product/${item.product.id}`}
                          className="text-xs text-primary hover:text-primary-dark font-semibold mt-1 inline-block"
                        >
                          Zobrazit detail
                        </a>
                      ) : (
                        <p className="text-xs text-mltext-light mt-1">Není v našem skladu</p>
                      )}
                    </div>

                    {item.product && (
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-mltext-dark">
                          {item.product.price_min
                            ? `${item.product.price_min.toFixed(0)} Kč`
                            : "—"}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            item.product.in_stock ? "text-mlgreen" : "text-mltext-light"
                          }`}
                        >
                          {item.product.in_stock
                            ? `Skladem (${item.product.stock_qty?.toFixed(0)} ks)`
                            : "Na objednávku"}
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
