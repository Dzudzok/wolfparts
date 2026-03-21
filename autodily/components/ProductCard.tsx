import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";
import ProductImage from "./ProductImage";
import AddToCartButton from "./AddToCartButton";

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
  const displayName = highlight?.name?.snippet || hit.name;
  const displayCode = highlight?.product_code?.snippet || hit.product_code;

  return (
    <a href={`/product/${hit.id}`} className="block group">
      <div className="bg-white rounded-xl border border-mlborder-light overflow-hidden hover:border-transparent hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
        {/* Image area */}
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-white overflow-hidden relative">
          <ProductImage
            imageUrl={hit.image_url}
            productId={hit.id}
            brand={hit.brand}
            alt={hit.name}
            className="w-full h-full p-4 group-hover:scale-105 transition-transform duration-300"
          />

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

          {/* Price + stock */}
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
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${hit.in_stock ? "text-mlgreen" : "text-mltext-light"}`}>
                  {hit.in_stock ? `${hit.stock_qty.toFixed(0)} ks` : "Na obj."}
                </span>
                <AddToCartButton
                  id={hit.id}
                  productCode={hit.product_code}
                  brand={hit.brand}
                  name={hit.name}
                  price={hit.price_min}
                  imageUrl={hit.image_url}
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
