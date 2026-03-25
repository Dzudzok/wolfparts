"use client";

import { useCart } from "@/lib/cart";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";

export default function CartDrawer() {
  const { items, count, total, removeItem, updateQty, clearCart, isOpen, setIsOpen } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mlborder-light">
          <h2 className="text-lg font-bold text-mltext-dark">Košík ({count})</h2>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-mltext" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-16">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-mlborder mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="text-mltext-light text-sm">Košík je prázdný</p>
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
              {/* Image */}
              <div className="w-16 h-16 rounded-lg bg-white border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                ) : hasManufacturerLogo(item.brand) ? (
                  <img src={getManufacturerLogoUrl(item.brand)} alt="" className="h-5 w-auto opacity-30" />
                ) : (
                  <span className="text-[9px] font-bold text-mltext-light/30 uppercase">{item.brand.slice(0, 3)}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-mltext-dark truncate">{item.name}</p>
                <p className="text-[11px] text-mltext-light">{item.brand} · {item.productCode}</p>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-mlborder rounded-lg">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="px-2 py-0.5 text-mltext hover:bg-gray-100 rounded-l-lg text-sm">−</button>
                    <span className="px-2 text-sm font-bold text-mltext-dark min-w-[2rem] text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-2 py-0.5 text-mltext hover:bg-gray-100 rounded-r-lg text-sm">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-mltext-light hover:text-primary transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                {item.price ? (
                  <span className="text-sm font-bold text-mltext-dark">{(item.price * item.qty).toFixed(0)} Kč</span>
                ) : (
                  <span className="text-xs text-mltext-light">—</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-mlborder-light p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-mltext-light">Celkem</span>
              <span className="text-xl font-extrabold text-mltext-dark">{total.toFixed(0)} Kč</span>
            </div>
            <a
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 text-center"
            >
              Pokračovat k objednávce →
            </a>
            <button onClick={clearCart} className="w-full text-sm text-mltext-light hover:text-primary font-semibold py-1 transition-colors">
              Vyprázdnit košík
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
