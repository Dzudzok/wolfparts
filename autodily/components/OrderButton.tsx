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
        setWarning(`Skladem pouze ${valItem.qtyToDelivery} ks, zbytek na objednávku`);
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
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center border border-mlborder rounded">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-mltext hover:bg-gray-50 rounded-l transition-colors">-</button>
          <span className="px-4 py-2 min-w-12 text-center font-bold text-mltext-dark">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-mltext hover:bg-gray-50 rounded-r transition-colors">+</button>
        </div>
        <button
          onClick={handleOrder}
          disabled={loading}
          className="bg-primary text-white font-bold py-2.5 px-8 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors text-lg"
        >
          {loading ? "..." : "Objednat"}
        </button>
      </div>
      {warning && <p className="text-sm text-mlorange font-semibold mb-1">{warning}</p>}
      {result && (
        <p className={`text-sm font-semibold ${result.includes("Chyba") ? "text-primary" : "text-mlgreen"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
