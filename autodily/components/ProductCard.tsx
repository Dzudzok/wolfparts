interface ProductCardProps {
  hit: {
    id: string;
    product_code: string;
    name: string;
    brand: string;
    category: string;
    price_min: number;
    price_max: number;
    in_stock: boolean;
    stock_qty: number;
    image_url?: string;
    is_sale?: boolean;
  };
  highlight?: Record<string, { snippet?: string }>;
}

export default function ProductCard({ hit, highlight }: ProductCardProps) {
  const hasImage = hit.image_url && hit.image_url !== "";
  const displayName = highlight?.name?.snippet || hit.name;
  const displayCode = highlight?.product_code?.snippet || hit.product_code;

  return (
    <a href={`/product/${hit.id}`} className="block group">
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
        {/* Image */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
          {hasImage ? (
            <img
              src={hit.image_url}
              alt={hit.name}
              className="object-contain w-full h-full p-2 group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : (
            <div className="text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
          {hit.is_sale && (
            <span className="absolute top-2 left-2 text-xs bg-red-500 text-white font-bold px-2 py-1 rounded">
              Akce
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex gap-1 mb-1 flex-wrap">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              {hit.brand}
            </span>
          </div>

          <h3
            className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem]"
            dangerouslySetInnerHTML={{ __html: displayName }}
          />

          <p
            className="text-xs text-gray-400 mb-2"
            dangerouslySetInnerHTML={{ __html: displayCode }}
          />

          <p className="text-base font-bold text-gray-900">
            {hit.price_min > 0 ? (
              <>
                {hit.price_min !== hit.price_max ? "od " : ""}
                {hit.price_min.toFixed(0)} Kc
              </>
            ) : (
              <span className="text-gray-400 text-sm">Cena na dotaz</span>
            )}
          </p>

          <p className={`text-xs mt-1 font-medium ${hit.in_stock ? "text-green-600" : "text-gray-400"}`}>
            {hit.in_stock
              ? `Skladem (${hit.stock_qty.toFixed(0)} ks)`
              : "Na objednavku"}
          </p>
        </div>
      </div>
    </a>
  );
}
