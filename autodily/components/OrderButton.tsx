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

  const handleOrder = async () => {
    setLoading(true);
    setResult(null);
    try {
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
        setResult(`Objednávka vytvořena: ${orderData.orders?.[0]?.No || "OK"}`);
      }
    } catch {
      setResult("Nepodařilo se odeslat objednávku");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-gray-300 rounded">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          -
        </button>
        <span className="px-3 py-2 min-w-[2.5rem] text-center">{qty}</span>
        <button
          onClick={() => setQty(qty + 1)}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          +
        </button>
      </div>
      <button
        onClick={handleOrder}
        disabled={loading}
        className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "Objednat"}
      </button>
      {result && (
        <span className={`text-sm ${result.includes("Chyba") ? "text-red-600" : "text-green-600"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
