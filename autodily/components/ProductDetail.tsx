"use client";

import { useEffect, useState } from "react";
import OrderButton from "./OrderButton";

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
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-blue-600">Katalog</a>
        <span className="mx-2">&gt;</span>
        <span>{product.category}</span>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-8"
            />
          ) : (
            <div className="text-gray-300">
              <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
              {product.brand}
            </span>
            {product.is_sale && (
              <span className="inline-block bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                Akce
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-500 mb-4">Kod: {product.product_code}</p>

          {/* Live price */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            {liveLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ) : live ? (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {live.priceRetail > 0 ? `${formatPrice(live.priceRetail)} Kc` : "Cena na dotaz"}
                </p>
                {live.discount > 0 && (
                  <p className="text-sm text-green-600 mt-1">Sleva {live.discount}%</p>
                )}
              </>
            ) : (
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {product.price_min > 0
                    ? product.price_min !== product.price_max
                      ? `od ${formatPrice(product.price_min)} Kc`
                      : `${formatPrice(product.price_min)} Kc`
                    : "Cena na dotaz"}
                </p>
                <p className="text-xs text-gray-400 mt-1">* orientacni cena</p>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {liveLoading ? (
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            ) : live ? (
              <p className={`text-sm font-medium ${live.inStock ? "text-green-600" : "text-orange-500"}`}>
                {live.inStock ? `Skladem — ${Math.floor(live.qty)} ks` : "Na objednavku"}
              </p>
            ) : (
              <p className={`text-sm font-medium ${product.in_stock ? "text-green-600" : "text-gray-400"}`}>
                {product.in_stock ? `Skladem (${Math.floor(product.stock_qty)} ks)` : "Na objednavku"}
              </p>
            )}
          </div>

          {/* Order */}
          <OrderButton productCode={product.product_code} brand={product.brand} />

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">Popis</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Technical info */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Technicke informace</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 w-40">Znacka</td>
                <td className="px-4 py-3 text-gray-900">{product.brand}</td>
              </tr>
              {product.brand_group && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Skupina</td>
                  <td className="px-4 py-3 text-gray-900">{product.brand_group}</td>
                </tr>
              )}
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Kategorie</td>
                <td className="px-4 py-3 text-gray-900">{product.category}</td>
              </tr>
              {product.assortment && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Sortiment</td>
                  <td className="px-4 py-3 text-gray-900">{product.assortment}</td>
                </tr>
              )}
              {product.oem_numbers.length > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 align-top">OEM cisla</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.oem_numbers.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {product.ean_codes.length > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 align-top">EAN kody</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.ean_codes.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {product.cross_numbers.length > 0 && (
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 align-top">Krizove ref.</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.cross_numbers.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{n}</span>
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
