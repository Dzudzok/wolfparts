"use client";

import { useEffect, useState } from "react";
import OrderButton from "./OrderButton";
import ProductGallery from "./ProductGallery";
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

export default function ProductDetail({ product }: { product: Product }) {
  const [live, setLive] = useState<LiveData | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/product-live?id=${product.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setLive(d);
      })
      .catch(() => {})
      .finally(() => setLiveLoading(false));
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
          <div className="bg-gray-50 border border-mlborder-light rounded p-4 mb-4">
            {liveLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ) : live ? (
              <>
                <p className="text-3xl font-bold text-mltext-dark">
                  {live.priceRetail > 0 ? `${formatPrice(live.priceRetail)} Kč` : "Cena na dotaz"}
                </p>
                {live.discount > 0 && (
                  <p className="text-sm text-mlgreen mt-1 font-semibold">Sleva {live.discount}%</p>
                )}
              </>
            ) : (
              <div>
                <p className="text-2xl font-bold text-mltext-dark">
                  {product.price_min > 0
                    ? product.price_min !== product.price_max
                      ? `od ${formatPrice(product.price_min)} Kč`
                      : `${formatPrice(product.price_min)} Kč`
                    : "Cena na dotaz"}
                </p>
                <p className="text-xs text-mltext-light mt-1">* orientační cena</p>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {liveLoading ? (
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            ) : live ? (
              <p className={`text-sm font-semibold ${live.inStock ? "text-mlgreen" : "text-mlorange"}`}>
                {live.inStock ? `Skladem — ${Math.floor(live.qty)} ks` : "Na objednávku"}
              </p>
            ) : (
              <p className={`text-sm font-semibold ${product.in_stock ? "text-mlgreen" : "text-mltext-light"}`}>
                {product.in_stock ? `Skladem (${Math.floor(product.stock_qty)} ks)` : "Na objednávku"}
              </p>
            )}
          </div>

          {/* Order */}
          <OrderButton productCode={product.product_code} brand={product.brand} />

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
    </div>
  );
}
