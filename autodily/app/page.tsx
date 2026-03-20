import SearchBox from "@/components/SearchBox";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-gray-900">
            Auto<span className="text-blue-600">Dily</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-24 md:py-32">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
          Najdete spravny dil
        </h1>
        <p className="text-lg text-gray-500 text-center mb-10 max-w-lg">
          Zadejte kod dilu, OEM cislo nebo EAN — okamzite zjistite cenu a dostupnost
        </p>
        <SearchBox large />
        <p className="text-sm text-gray-400 mt-4">
          Hledani funguje podle kodu vyrobce, OEM cisel i EAN kodu
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center">
          Jak to funguje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-3">1</div>
            <h3 className="font-semibold text-gray-900 mb-2">Zadejte kod</h3>
            <p className="text-sm text-gray-500">
              Kod dilu, OEM cislo nebo EAN
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-3">2</div>
            <h3 className="font-semibold text-gray-900 mb-2">Overite dostupnost</h3>
            <p className="text-sm text-gray-500">
              Aktualni cena a stav skladu v realnem case
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-3">3</div>
            <h3 className="font-semibold text-gray-900 mb-2">Objednejte</h3>
            <p className="text-sm text-gray-500">
              Objednavka primo do systemu s potvrzenim
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
