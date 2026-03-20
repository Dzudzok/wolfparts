import { getTypesenseAdminClient } from "@/lib/typesense";
import ProductDetail from "@/components/ProductDetail";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  let product;
  try {
    const client = getTypesenseAdminClient();
    product = await client.collections("products").documents(id).retrieve();
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
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ProductDetail product={product as any} />
      </div>
    </main>
  );
}
