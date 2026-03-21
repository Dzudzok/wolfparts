import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";

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
      <div className="bg-white rounded-xl border border-mlborder-light overflow-hidden hover:border-transparent hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
        {/* Image area */}
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center overflow-hidden relative p-4">
          {hasImage ? (
            <img
              src={hit.image_url}
              alt={hit.name}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-gray-200">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {hit.is_sale && (
              <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                Akce
              </span>
            )}
            {hit.in_stock && (
              <span className="text-[10px] bg-mlgreen text-white font-bold px-2 py-0.5 rounded-md shadow-sm">
                Skladem
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Brand */}
          <div className="flex items-center gap-1.5 mb-1">
            {hasManufacturerLogo(hit.brand) && (
              <img src={getManufacturerLogoUrl(hit.brand)} alt="" className="h-4 w-auto object-contain" loading="lazy" />
            )}
            <span className="text-[11px] text-mltext-light font-semibold uppercase tracking-wider">
              {hit.brand}
            </span>
          </div>

          {/* Name */}
          <h3
            className="text-[14px] font-semibold text-mltext-dark line-clamp-2 mb-1 min-h-10 leading-snug group-hover:text-primary transition-colors"
            dangerouslySetInnerHTML={{ __html: displayName }}
          />

          {/* Code */}
          <p
            className="text-[11px] text-mltext-light font-mono mb-3"
            dangerouslySetInnerHTML={{ __html: displayCode }}
          />

          {/* Price + stock — pushed to bottom */}
          <div className="mt-auto pt-3 border-t border-mlborder-light">
            <div className="flex items-end justify-between">
              <div>
                {hit.price_min > 0 ? (
                  <>
                    <span className="text-lg font-extrabold text-mltext-dark leading-none">
                      {hit.price_min.toFixed(0)}
                    </span>
                    <span className="text-sm font-bold text-mltext-light ml-0.5">Kč</span>
                    {hit.price_min !== hit.price_max && (
                      <span className="text-[11px] text-mltext-light ml-1">od</span>
                    )}
                  </>
                ) : (
                  <span className="text-mltext-light text-sm font-medium">Na dotaz</span>
                )}
              </div>
              <div className={`text-[11px] font-bold ${hit.in_stock ? "text-mlgreen" : "text-mltext-light"}`}>
                {hit.in_stock ? `${hit.stock_qty.toFixed(0)} ks` : "Na obj."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
