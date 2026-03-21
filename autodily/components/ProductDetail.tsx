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

export default function ProductDetail({ product }: { product: Product }) {
  const [live, setLive] = useState<LiveData | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [tecdocAttrs, setTecdocAttrs] = useState<TecDocAttr[]>([]);
  const [tecdocVehicles, setTecdocVehicles] = useState("");

  useEffect(() => {
    fetch(`/api/product-live?id=${product.id}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setLive(d); })
      .catch(() => {})
      .finally(() => setLiveLoading(false));

    // Fetch TecDoc attributes (from product-image API which also scrapes attributes)
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

      {/* Technical info */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-mltext-dark mb-4">Technické informace</h2>
        <div className="bg-white rounded border border-mlborder overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-mlborder-light">
                <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50 w-40">Značka</td>
                <td className="px-4 py-3 text-mltext-dark">{product.brand}</td>
              </tr>
              {product.brand_group && (
                <tr className="border-b border-mlborder-light">
                  <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50">Skupina</td>
                  <td className="px-4 py-3 text-mltext-dark">{product.brand_group}</td>
                </tr>
              )}
              <tr className="border-b border-mlborder-light">
                <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50">Kategorie</td>
                <td className="px-4 py-3 text-mltext-dark">{product.category}</td>
              </tr>
              {product.assortment && (
                <tr className="border-b border-mlborder-light">
                  <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50">Sortiment</td>
                  <td className="px-4 py-3 text-mltext-dark">{product.assortment}</td>
                </tr>
              )}
              {product.oem_numbers.length > 0 && (
                <tr className="border-b border-mlborder-light">
                  <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50 align-top">OEM čísla</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.oem_numbers.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-mltext text-xs px-2 py-1 rounded">{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {product.ean_codes.length > 0 && (
                <tr className="border-b border-mlborder-light">
                  <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50 align-top">EAN kódy</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.ean_codes.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-mltext text-xs px-2 py-1 rounded">{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {product.cross_numbers.length > 0 && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-mltext-light bg-gray-50 align-top">Křížové ref.</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.cross_numbers.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-mltext text-xs px-2 py-1 rounded">{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* TecDoc specifications */}
      {tecdocAttrs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-mltext-dark mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516" />
            </svg>
            TecDoc specifikace
          </h2>
          <div className="bg-white rounded-xl border border-mlborder overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {tecdocAttrs.map((attr, i) => (
                  <tr key={i} className={i < tecdocAttrs.length - 1 ? "border-b border-mlborder-light" : ""}>
                    <td className="px-4 py-2.5 font-semibold text-mltext-light bg-gray-50 w-52 text-[13px]">{attr.key}</td>
                    <td className="px-4 py-2.5 text-mltext-dark text-[13px]">{attr.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle compatibility */}
      {tecdocVehicles && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-mltext-dark mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9" />
            </svg>
            Vhodné pro vozidla
          </h2>
          <div className="bg-gray-50 rounded-xl border border-mlborder-light p-4">
            <p className="text-sm text-mltext leading-relaxed">{tecdocVehicles}</p>
          </div>
        </div>
      )}
    </div>
  );
}
