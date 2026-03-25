"use client";

import { useState, useEffect } from "react";

interface LivePriceData {
  price: number;
  priceVAT: number;
  qty: number;
  inStock: boolean;
  valid: boolean;
}

export default function LivePrice({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const [data, setData] = useState<LivePriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch(`/api/product-live?id=${productId}`, {
      headers: userToken ? { "x-user-token": userToken } : {},
    })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-16 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!data || !data.valid) {
    return <span className="text-mltext-light text-sm font-medium">Na dotaz</span>;
  }

  if (compact) {
    return (
      <div>
        <span className="text-lg font-extrabold text-mltext-dark leading-none">
          {data.price.toFixed(0)}
        </span>
        <span className="text-sm font-bold text-mltext-light ml-0.5">Kč</span>
        {data.priceVAT > 0 && (
          <span className="text-[10px] text-mltext-light ml-1">od</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <span className="text-2xl font-extrabold text-mltext-dark">
        {data.price.toFixed(0)}
      </span>
      <span className="text-sm font-bold text-mltext-light ml-1">Kč bez DPH</span>
      {data.priceVAT > 0 && (
        <p className="text-[12px] text-mltext-light mt-0.5">{data.priceVAT.toFixed(0)} Kč s DPH</p>
      )}
    </div>
  );
}

export function LiveStock({ productId }: { productId: string }) {
  const [data, setData] = useState<LivePriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/product-live?id=${productId}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="animate-pulse h-3 w-12 bg-gray-200 rounded" />;
  if (!data) return <span className="text-[11px] text-mltext-light">Na obj.</span>;

  return (
    <span className={`text-[11px] font-bold ${data.inStock ? "text-mlgreen" : "text-mltext-light"}`}>
      {data.inStock ? `${data.qty} ks` : "Na obj."}
    </span>
  );
}
