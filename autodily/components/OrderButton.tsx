"use client";

import { useState } from "react";

interface OrderButtonProps {
  productCode: string;
  brand: string;
}

export default function OrderButton({ productCode, brand }: OrderButtonProps) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleOrder = async () => {
    setLoading(true);
    setResult(null);
    setWarning(null);
    try {
      // Validate
      const valRes = await fetch("/api/order-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ code: productCode, brand, qty }],
        }),
      });
      const valData = await valRes.json();
      if (valData.error) {
        setResult(`Chyba: ${valData.error}`);
        return;
      }

      const valItem = valData.items?.[0];
      if (valItem?.qtyToDelivery < qty) {
        setWarning(`Skladem pouze ${valItem.qtyToDelivery} ks, zbytek na objednavku`);
      }

      // Send order
      const orderRes = await fetch("/api/order-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ code: productCode, brand, qty }],
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.error) {
        setResult(`Chyba: ${orderData.error}`);
      } else {
        setResult(`Objednavka vytvorena: ${orderData.orders?.[0]?.No || "OK"}`);
      }
    } catch {
      setResult("Nepodarilo se odeslat objednavku");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
          <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
        </div>
        <button
          onClick={handleOrder}
          disabled={loading}
          className="bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
        >
          {loading ? "..." : "Objednat"}
        </button>
      </div>
      {warning && <p className="text-sm text-yellow-600 mb-1">{warning}</p>}
      {result && (
        <p className={`text-sm ${result.includes("Chyba") ? "text-red-600" : "text-green-600"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
