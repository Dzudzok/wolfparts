import SearchBox from "@/components/SearchBox";
import SyncButton from "@/components/SyncButton";
import VehicleSelector from "@/components/VehicleSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-gray-900">
            Auto<span className="text-blue-600">Dily</span>
          </a>
          <div className="flex items-center gap-4">
            <SyncButton />
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a href="/search?q=*" className="hover:text-blue-600">Katalog</a>
              <a href="/search?q=*&is_sale=true" className="hover:text-blue-600">Akce</a>
            </nav>
          </div>
        </div>
      </header>

      <section className="flex flex-col items-center justify-center px-4 py-24 md:py-32">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
          Najdete spravny dil
        </h1>
        <p className="text-lg text-gray-500 text-center mb-10 max-w-md">
          Prohledejte katalog autodilu — nazev, kod OEM, EAN nebo krizove reference
        </p>
        <SearchBox large />

        <div className="mt-8 w-full flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-3">nebo hledejte podle vozidla</p>
          <VehicleSelector />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Popularni kategorie
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Brzdove desticky", query: "brzdove desticky" },
            { name: "Filtry", query: "filtr" },
            { name: "Oleje", query: "olej" },
            { name: "Svicky", query: "svicka zapalovaci" },
            { name: "Remeny", query: "remen" },
            { name: "Tlumice", query: "tlumic" },
            { name: "Loziska", query: "lozisko" },
            { name: "Spojky", query: "spojka" },
          ].map((cat) => (
            <a
              key={cat.name}
              href={`/search?q=${encodeURIComponent(cat.query)}`}
              className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg px-4 py-6 text-center transition-colors"
            >
              <span className="text-gray-900 font-medium">{cat.name}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
