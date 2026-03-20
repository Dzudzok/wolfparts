import ProductCard from "./ProductCard";
import type { CatalogItem } from "@/lib/nextis-api";

interface ProductGridProps {
  items: CatalogItem[];
}

export default function ProductGrid({ items }: ProductGridProps) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg">Zadny vysledek</p>
        <p className="text-sm mt-1">Zkontrolujte kod a zkuste znovu</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ProductCard
          key={item.ID}
          id={item.ID}
          productCode={item.ProductCode}
          productName={item.ProductName}
          productBrand={item.ProductBrand}
          price={item.Price?.UnitPrice ?? 0}
          priceIncVAT={item.Price?.UnitPriceIncVAT ?? 0}
          discount={item.Price?.Discount ?? 0}
          qty={item.QtyAvailableMain ?? 0}
          qtySupplier={item.QtyAvailableSupplier ?? 0}
          inStock={(item.QtyAvailableMain ?? 0) > 0}
        />
      ))}
    </div>
  );
}
