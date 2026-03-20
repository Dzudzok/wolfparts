import ProductCard from "./ProductCard";

interface SearchHit {
  document: {
    id: string;
    name: string;
    product_code: string;
    brand: string;
    category: string;
    price_min: number;
    price_max: number;
    in_stock: boolean;
    stock_qty: number;
    is_sale: boolean;
    image_url?: string;
  };
  highlight?: Record<string, { snippet?: string }>;
}

interface ProductGridProps {
  hits: SearchHit[];
}

export default function ProductGrid({ hits }: ProductGridProps) {
  if (!hits.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg">Zadne vysledky</p>
        <p className="text-sm mt-1">Zkuste zmenit hledany vyraz nebo filtry</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {hits.map((hit) => (
        <ProductCard key={hit.document.id} hit={hit.document} highlight={hit.highlight} />
      ))}
    </div>
  );
}
