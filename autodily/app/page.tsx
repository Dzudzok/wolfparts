import Header from "@/components/Header";
import VehicleSelector from "@/components/VehicleSelector";
import BrandGrid from "@/components/BrandGrid";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* Dark hero area with header */}
      <div className="bg-mlbg relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/[0.03] rounded-full blur-[80px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        <Header />

        {/* Hero content */}
        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 pb-14">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 bg-mlgreen rounded-full animate-pulse" />
              <span className="text-white/50 text-xs font-semibold tracking-wide">200 000+ dílů skladem</span>
            </div>
            <h1 className="text-white text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight mb-4 tracking-tight">
              Najděte správný díl<br />
              <span className="text-gradient">pro vaše auto</span>
            </h1>
            <p className="text-white/40 text-base lg:text-lg max-w-lg mx-auto">
              Hledejte podle vozidla, OEM kódu nebo názvu dílu. Rychlé doručení po celé ČR.
            </p>
          </div>

          {/* Vehicle selector card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary-light" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-[15px]">Vyberte vaše vozidlo</h2>
                  <p className="text-white/30 text-xs">Značka → Model → Motorizace</p>
                </div>
              </div>
              <VehicleSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Main content on light bg */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          {/* Trust bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -mt-6 relative z-10 mb-10">
            {[
              { icon: "M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1m8-1a1 1 0 0 1-1 1H9m4-1V8a1 1 0 0 1 1-1h2.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V16a1 1 0 0 1-1 1h-1m-6-1a1 1 0 0 0 1 1h1M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0", label: "Doručení do 24h", sub: "Po celé ČR a SR" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516", label: "Ověřené díly", sub: "Originální a aftermarket" },
              { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z", label: "Bezpečná platba", sub: "Kartou, převodem, na dobírku" },
              { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15", label: "Vrácení do 14 dnů", sub: "Bez udání důvodu" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-mlborder-light hover:shadow-md hover:border-mlborder transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/[0.06] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div>
                  <span className="block text-mltext-dark text-sm font-bold leading-tight">{item.label}</span>
                  <span className="block text-mltext-light text-[11px]">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Brand grid */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-mltext-dark text-2xl font-bold">Autodíly podle značky</h2>
                <p className="text-mltext-light text-sm mt-1">Vyberte výrobce vašeho vozu</p>
              </div>
              <a href="/search?q=*" className="hidden sm:flex items-center gap-1.5 text-primary text-sm font-semibold hover:text-primary-dark transition-colors group">
                Všechny značky
                <svg viewBox="0 0 24 24" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </a>
            </div>
            <BrandGrid />
          </section>

          {/* Promo banner */}
          <section className="mb-12">
            <div className="relative rounded-2xl overflow-hidden bg-mlbg p-8 lg:p-12 flex items-center min-h-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-mlbg via-mlbg/95 to-mlbg/60" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-accent/10 rounded-full blur-[60px]" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary-light text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Akce týdne
                </span>
                <h3 className="text-white text-2xl lg:text-3xl font-bold mb-2 leading-tight">
                  Motorové oleje se slevou<br />až <span className="text-gradient">30%</span>
                </h3>
                <p className="text-white/40 text-sm mb-6 max-w-md">
                  Castrol, Mobil, Shell a další prémiové značky za nejlepší ceny
                </p>
                <a
                  href="/search?q=olej&is_sale=true"
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-mltext-dark font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Zobrazit nabídku
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              </div>
            </div>
          </section>

          {/* Popular categories */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-mltext-dark text-2xl font-bold">Populární kategorie</h2>
                <p className="text-mltext-light text-sm mt-1">Nejčastěji hledané autodíly</p>
              </div>
            </div>
            <CategoryGrid />
          </section>
        </div>
      </main>

      <Footer />

      {/* Chat button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
