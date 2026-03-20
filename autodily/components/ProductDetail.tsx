"use client";

import { useState } from "react";

interface ProductData {
  id: number;
  productCode: string;
  productName: string;
  productDescription: string;
  productBrand: string;
  price: number;
  priceIncVAT: number;
  priceRetail: number;
  priceRetailIncVAT: number;
  discount: number;
  currency: string;
  qty: number;
  qtySupplier: number;
  inStock: boolean;
  valid: boolean;
  oeCodes: Array<{ Code: string; Manufacturer: string }>;
  barCodes: string[];
}

interface ProductDetailProps {
  product: ProductData;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [qty, setQty] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const formatPrice = (p: number) =>
    p.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleOrder = async () => {
    setOrdering(true);
    setOrderResult(null);
    setWarning(null);
    try {
      // 1. Validate
      const valRes = await fetch("/api/order-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ code: product.productCode, brand: product.productBrand, qty }],
        }),
      });
      const valData = await valRes.json();
      if (valData.error) {
        setOrderResult(`Chyba validace: ${valData.error}`);
        return;
      }

      const valItem = valData.items?.[0];
      if (!valItem || valItem.status === "cancelled") {
        setOrderResult("Produkt neni dostupny");
        return;
      }

      if (valItem.qtyToDelivery < qty) {
        setWarning(`Skladem pouze ${valItem.qtyToDelivery} ks, zbytek na objednavku`);
      }

      // 2. Send order
      const orderRes = await fetch("/api/order-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ code: product.productCode, brand: product.productBrand, qty }],
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.error) {
        setOrderResult(`Chyba objednavky: ${orderData.error}`);
      } else {
        const orderNo = orderData.orders?.[0]?.No || "OK";
        setOrderResult(`Objednavka vytvorena: ${orderNo}`);
      }
    } catch {
      setOrderResult("Nepodarilo se vytvorit objednavku");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-blue-600">Katalog</a>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">{product.productName}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left: info */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
              {product.productBrand}
            </span>
            {product.discount > 0 && (
              <span className="inline-block bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded">
                -{product.discount}%
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.productName}</h1>
          <p className="text-gray-500 font-mono mb-6">Kod: {product.productCode}</p>

          {product.productDescription && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Popis</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{product.productDescription}</p>
            </div>
          )}

          {/* OE codes */}
          {product.oeCodes.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">OE cisla</h2>
              <div className="flex flex-wrap gap-1.5">
                {product.oeCodes.map((oe, i) => (
                  <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs font-mono px-2 py-1 rounded">
                    {oe.Manufacturer}: {oe.Code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* EAN codes */}
          {product.barCodes.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">EAN kody</h2>
              <div className="flex flex-wrap gap-1.5">
                {product.barCodes.map((ean, i) => (
                  <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs font-mono px-2 py-1 rounded">
                    {ean}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: price + order */}
        <div className="md:col-span-2">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-20">
            {/* Price */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {formatPrice(product.priceRetailIncVAT)} Kc
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatPrice(product.priceRetail)} Kc bez DPH
              </div>
              {product.discount > 0 && (
                <div className="text-sm text-gray-400 mt-1">
                  Vase cena: {formatPrice(product.priceIncVAT)} Kc s DPH
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              {product.inStock ? (
                <span className="text-green-600 font-semibold text-lg">
                  Skladem {Math.floor(product.qty)} ks
                </span>
              ) : product.qtySupplier > 0 ? (
                <span className="text-yellow-600 font-medium">
                  U dodavatele ({Math.floor(product.qtySupplier)} ks)
                </span>
              ) : (
                <span className="text-gray-400">Na objednavku</span>
              )}
            </div>

            {/* Qty selector + order */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                >
                  -
                </button>
                <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">ks</span>
            </div>

            <button
              onClick={handleOrder}
              disabled={ordering}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
            >
              {ordering ? "Zpracovavam..." : "Objednat"}
            </button>

            {warning && (
              <p className="mt-3 text-sm text-yellow-600">{warning}</p>
            )}
            {orderResult && (
              <p className={`mt-3 text-sm ${orderResult.includes("Chyba") || orderResult.includes("neni") ? "text-red-600" : "text-green-600"}`}>
                {orderResult}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
