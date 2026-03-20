import Link from "next/link";

interface ProductCardProps {
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
  highlight?: {
    name?: { snippet?: string };
    product_code?: { snippet?: string };
  };
}

export default function ProductCard({
  id,
  name,
  product_code,
  brand,
  category,
  price_min,
  price_max,
  in_stock,
  stock_qty,
  is_sale,
  image_url,
  highlight,
}: ProductCardProps) {
  const displayName = highlight?.name?.snippet || name;
  const displayCode = highlight?.product_code?.snippet || product_code;

  const formatPrice = (p: number) =>
    p.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <Link
      href={`/product/${id}`}
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
        {is_sale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            AKCE
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand badge */}
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded mb-2">
          {brand}
        </span>

        {/* Name */}
        <h3
          className="text-sm font-medium text-gray-900 line-clamp-2 mb-1"
          dangerouslySetInnerHTML={{ __html: displayName }}
        />

        {/* Code */}
        <p
          className="text-xs text-gray-500 mb-2"
          dangerouslySetInnerHTML={{ __html: displayCode }}
        />

        {/* Category */}
        <p className="text-xs text-gray-400 mb-3">{category}</p>

        {/* Price */}
        <div className="text-lg font-bold text-gray-900 mb-2">
          {price_min !== price_max ? (
            <>od {formatPrice(price_min)} Kč</>
          ) : (
            <>{formatPrice(price_min)} Kč</>
          )}
        </div>

        {/* Stock status */}
        <div className="flex items-center justify-between">
          {in_stock ? (
            <span className="text-sm text-green-600 font-medium">
              Skladem ({Math.floor(stock_qty)} ks)
            </span>
          ) : (
            <span className="text-sm text-gray-400">Na objednávku</span>
          )}
          <span className="text-sm text-blue-600 font-medium group-hover:text-blue-800">
            Detail &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
