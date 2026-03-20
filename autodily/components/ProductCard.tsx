import Link from "next/link";

interface ProductCardProps {
  id: number;
  productCode: string;
  productName: string;
  productBrand: string;
  price: number;
  priceIncVAT: number;
  discount: number;
  qty: number;
  qtySupplier: number;
  inStock: boolean;
}

export default function ProductCard({
  id,
  productCode,
  productName,
  productBrand,
  price,
  priceIncVAT,
  discount,
  qty,
  qtySupplier,
  inStock,
}: ProductCardProps) {
  const formatPrice = (p: number) =>
    p.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Link
      href={`/product/${id}`}
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-5">
        {/* Brand + discount */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded">
            {productBrand}
          </span>
          {discount > 0 && (
            <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
          {productName}
        </h3>

        {/* Code */}
        <p className="text-xs text-gray-500 font-mono mb-4">
          {productCode}
        </p>

        {/* Price */}
        <div className="mb-3">
          <div className="text-xl font-bold text-gray-900">
            {formatPrice(priceIncVAT)} Kc
          </div>
          <div className="text-xs text-gray-500">
            {formatPrice(price)} Kc bez DPH
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between">
          {inStock ? (
            <span className="text-sm text-green-600 font-medium">
              Skladem {Math.floor(qty)} ks
            </span>
          ) : qtySupplier > 0 ? (
            <span className="text-sm text-yellow-600 font-medium">
              U dodavatele ({Math.floor(qtySupplier)} ks)
            </span>
          ) : (
            <span className="text-sm text-gray-400">Na objednavku</span>
          )}
          <span className="text-sm text-blue-600 font-medium group-hover:text-blue-800">
            Detail &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
