import { checkItemsByID } from "@/lib/nextis-api";
import ProductDetail from "@/components/ProductDetail";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) notFound();

  let product;
  try {
    const items = await checkItemsByID([numericId]);
    const item = items[0];
    if (!item) notFound();

    product = {
      id: item.ID,
      productCode: item.ProductCode,
      productName: item.ProductName,
      productDescription: item.ProductDescription,
      productBrand: item.ProductBrand,
      price: item.Price?.UnitPrice ?? 0,
      priceIncVAT: item.Price?.UnitPriceIncVAT ?? 0,
      priceRetail: item.Price?.UnitPriceRetail ?? 0,
      priceRetailIncVAT: item.Price?.UnitPriceRetailIncVAT ?? 0,
      discount: item.Price?.Discount ?? 0,
      currency: "CZK",
      qty: item.QtyAvailableMain ?? 0,
      qtySupplier: item.QtyAvailableSupplier ?? 0,
      inStock: (item.QtyAvailableMain ?? 0) > 0,
      valid: item.Price?.Valid ?? false,
      oeCodes: item.OECodes ?? [],
      barCodes: item.BarCodes ?? [],
    };
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-xl font-bold text-gray-900 shrink-0">
            Auto<span className="text-blue-600">Dily</span>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductDetail product={product} />
      </div>
    </main>
  );
}
