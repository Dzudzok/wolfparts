import ProductCard from "./ProductCard";

interface SearchHit {
  document: {
    id: string; name: string; product_code: string; brand: string; category: string;
    price_min: number; price_max: number; in_stock: boolean; stock_qty: number; is_sale: boolean; image_url?: string;
  };
  highlight?: Record<string, { snippet?: string }>;
}

export default function ProductGrid({ hits }: { hits: SearchHit[] }) {
  if (!hits.length) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-mltext-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-mltext-dark">Žádné výsledky</p>
        <p className="text-sm text-mltext-light mt-1">Zkuste změnit hledaný výraz nebo filtry</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {hits.map((hit) => (
        <ProductCard key={hit.document.id} hit={hit.document} highlight={hit.highlight} />
      ))}
    </div>
  );
}
