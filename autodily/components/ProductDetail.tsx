"use client";

import { useEffect, useState } from "react";

interface LiveData {
  price: number;
  priceIncVAT: number;
  priceRetail: number;
  priceRetailIncVAT: number;
  discount: number;
  qty: number;
  qtySupplier: number;
  valid: boolean;
}

interface ProductDetailProps {
  product: {
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
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/product-live?id=${product.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setLive(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [product.id]);

  const handleOrder = async () => {
    setOrdering(true);
    setOrderResult(null);
    try {
      // Validate first
      const valRes = await fetch("/api/order-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ code: product.product_code, brand: product.brand, qty: 1 }],
        }),
      });
      const valData = await valRes.json();
      if (valData.error) {
        setOrderResult(`Chyba validace: ${valData.error}`);
        return;
      }

      // Send order
      const orderRes = await fetch("/api/order-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ code: product.product_code, brand: product.brand, qty: 1 }],
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.error) {
        setOrderResult(`Chyba objednávky: ${orderData.error}`);
      } else {
        const orderNo = orderData.orders?.[0]?.No || "OK";
        setOrderResult(`Objednávka vytvořena: ${orderNo}`);
      }
    } catch {
      setOrderResult("Nepodařilo se vytvořit objednávku");
    } finally {
      setOrdering(false);
    }
  };

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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded mb-3">
            {product.brand}
          </span>
          {product.is_sale && (
            <span className="inline-block bg-red-500 text-white text-sm font-bold px-3 py-1 rounded ml-2 mb-3">
              AKCE
            </span>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-500 mb-4">Kód: {product.product_code}</p>

          {/* Live price */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ) : live ? (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(live.priceRetailIncVAT)} Kč
                  <span className="text-base font-normal text-gray-500 ml-2">s DPH</span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatPrice(live.priceRetail)} Kč bez DPH
                </div>
                {live.discount > 0 && (
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-2 py-0.5 rounded mt-2">
                    Sleva {live.discount}%
                  </span>
                )}
              </>
            ) : (
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {product.price_min !== product.price_max
                    ? `od ${formatPrice(product.price_min)} Kč`
                    : `${formatPrice(product.price_min)} Kč`}
                </div>
                <p className="text-xs text-gray-400 mt-1">Orientační cena z katalogu</p>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {loading ? (
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            ) : live ? (
              live.qty > 0 ? (
                <span className="text-green-600 font-semibold text-lg">
                  Skladem {Math.floor(live.qty)} ks
                </span>
              ) : live.qtySupplier > 0 ? (
                <span className="text-yellow-600 font-medium">
                  U dodavatele ({Math.floor(live.qtySupplier)} ks)
                </span>
              ) : (
                <span className="text-gray-400">Na objednávku</span>
              )
            ) : product.in_stock ? (
              <span className="text-green-600 font-semibold">
                Skladem ({Math.floor(product.stock_qty)} ks)
              </span>
            ) : (
              <span className="text-gray-400">Na objednávku</span>
            )}
          </div>

          {/* Order button */}
          <button
            onClick={handleOrder}
            disabled={ordering}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
          >
            {ordering ? "Zpracovávám..." : "Přidat do košíku"}
          </button>
          {orderResult && (
            <p className={`mt-3 text-sm ${orderResult.includes("Chyba") ? "text-red-600" : "text-green-600"}`}>
              {orderResult}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">Popis</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Technical table */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Technické informace</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 w-40">Značka</td>
                <td className="px-4 py-3 text-gray-900">{product.brand}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Skupina</td>
                <td className="px-4 py-3 text-gray-900">{product.brand_group}</td>
              </tr>
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
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 align-top">OEM čísla</td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {product.oem_numbers.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {product.ean_codes.length > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 align-top">EAN kódy</td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {product.ean_codes.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {product.cross_numbers.length > 0 && (
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 align-top">Křížové ref.</td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {product.cross_numbers.map((n, i) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {n}
                        </span>
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
