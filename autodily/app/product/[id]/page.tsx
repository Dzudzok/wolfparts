import { getTypesenseAdminClient } from "@/lib/typesense";
import Header from "@/components/Header";
import ProductDetail from "@/components/ProductDetail";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen flex flex-col bg-mlbg">
      <Header />

      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ProductDetail product={product as any} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
