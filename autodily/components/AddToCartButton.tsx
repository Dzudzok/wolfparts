"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

interface AddToCartButtonProps {
  id: string;
  productCode: string;
  brand: string;
  name: string;
  price: number;
  imageUrl?: string;
  compact?: boolean;
}

export default function AddToCartButton({ id, productCode, brand, name, price, imageUrl, compact }: AddToCartButtonProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();

  const handleAdd = () => {
    cart.addItem({ id, productCode, brand, name, price: price || null, imageUrl, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (compact) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(); }}
        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
          added
            ? "bg-mlgreen text-white"
            : "bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md"
        }`}
      >
        {added ? "✓" : "Do košíku"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Qty selector */}
      <div className="flex items-center border-2 border-mlborder rounded-xl">
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-mltext hover:bg-gray-50 rounded-l-xl transition-colors font-bold">−</button>
        <span className="px-4 py-2 min-w-12 text-center font-bold text-mltext-dark">{qty}</span>
        <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-mltext hover:bg-gray-50 rounded-r-xl transition-colors font-bold">+</button>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className={`flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl transition-all text-base ${
          added
            ? "bg-mlgreen text-white shadow-lg shadow-mlgreen/30"
            : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/40"
        }`}
      >
        {added ? (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Přidáno
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="12" y1="10" x2="12" y2="18" />
              <line x1="8" y1="14" x2="16" y2="14" />
            </svg>
            Do košíku
          </>
        )}
      </button>
    </div>
  );
}
