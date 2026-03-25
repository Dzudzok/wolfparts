import Header from "@/components/Header";
import VehiclePickerButton from "@/components/VehiclePickerButton";
import BrandGrid from "@/components/BrandGrid";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* ═══════════════ HERO ═══════════════ */}
      <div className="bg-mlbg relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-mlbg/85 via-mlbg/75 to-mlbg" />
        </div>
        <Header />
        <div className="relative max-w-[1200px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-20 lg:pb-28">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left: text + stats */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-white text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.1] mb-4 tracking-tight">
                Najděte správný díl<br />
                <span className="text-gradient">pro vaše auto</span>
              </h1>
              <p className="text-white/40 text-base lg:text-lg max-w-md mx-auto lg:mx-0 mb-6">
                Originální i aftermarket díly od 200+ výrobců. Doručení do 24 hodin po celé ČR a SR.
              </p>
              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-white/50">
                <div>
                  <span className="block text-2xl font-bold text-white">6 000 000+</span>
                  <span className="text-[11px] uppercase tracking-wider">dílů skladem</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <span className="block text-2xl font-bold text-white">200+</span>
                  <span className="text-[11px] uppercase tracking-wider">výrobců</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <span className="block text-2xl font-bold text-white">24h</span>
                  <span className="text-[11px] uppercase tracking-wider">doručení</span>
                </div>
              </div>
            </div>

            {/* Right: Vehicle picker card — THE main CTA */}
            <div className="w-full lg:w-[440px] shrink-0">
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-6 lg:p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-mltext-dark font-bold text-[16px]">Hledám díly pro vozidlo</span>
                    <span className="block text-mltext-light text-[12px]">Vyberte značku, model a motor</span>
                  </div>
                </div>
                <VehiclePickerButton />
                {/* Quick VIN link */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[12px] text-mltext-light">Znáte VIN kód?</span>
                  <a href="/vin" className="text-[12px] text-primary font-bold hover:text-primary-dark transition-colors flex items-center gap-1">
                    Hledat podle VIN
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">

          {/* ═══════════════ BRAND GRID ═══════════════ */}
          <section className="-mt-10 relative z-10 mb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-mlborder-light p-6 lg:p-8">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-mltext-dark text-xl font-bold">Vyberte značku vozu</h2>
                  <p className="text-mltext-light text-sm mt-0.5">20 nejpopulárnějších značek nebo hledejte v katalogu</p>
                </div>
                <a href="/search?q=*" className="hidden sm:flex items-center gap-1 text-primary text-sm font-semibold hover:text-primary-dark transition-colors group">
                  Všechny značky
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              </div>
              <BrandGrid />
            </div>
          </section>

          {/* ═══════════════ TRUST BAR ═══════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {[
              { icon: "M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1m8-1a1 1 0 0 1-1 1H9m4-1V8a1 1 0 0 1 1-1h2.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V16a1 1 0 0 1-1 1h-1m-6-1a1 1 0 0 0 1 1h1M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0", label: "Doručení do 24h", sub: "Po celé ČR a SR", color: "#10B981" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516", label: "Ověřené díly", sub: "TecDoc katalog", color: "#3B82F6" },
              { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z", label: "Bezpečná platba", sub: "Kartou, převodem", color: "#8B5CF6" },
              { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15", label: "Vrácení do 14 dnů", sub: "Bez udání důvodu", color: "#F59E0B" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-4 flex items-center gap-3 border border-mlborder-light">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + "10" }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: item.color }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div>
                  <span className="block text-mltext-dark text-[13px] font-bold leading-tight">{item.label}</span>
                  <span className="block text-mltext-light text-[11px]">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ═══════════════ CATEGORIES ═══════════════ */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-mltext-dark text-xl font-bold">Populární kategorie</h2>
                <p className="text-mltext-light text-sm mt-0.5">Nejčastěji hledané autodíly</p>
              </div>
            </div>
            <CategoryGrid />
          </section>

          {/* ═══════════════ PROMO ═══════════════ */}
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Promo 1: Oils */}
              <a href="/search?q=olej&is_sale=true" className="group relative rounded-2xl overflow-hidden bg-mlbg p-7 min-h-[180px] flex flex-col justify-end hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-mlbg via-mlbg/90 to-primary/20" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-primary/25 text-primary-light text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 uppercase tracking-wider">Akce</span>
                  <h3 className="text-white text-xl font-bold mb-1">Motorové oleje se slevou až 30%</h3>
                  <p className="text-white/40 text-sm">Castrol, Mobil, Shell a další</p>
                </div>
              </a>

              {/* Promo 2: VIN */}
              <a href="/vin" className="group relative rounded-2xl overflow-hidden bg-mlbg p-7 min-h-[180px] flex flex-col justify-end hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-mlbg via-mlbg/90 to-blue-500/20" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-blue-500/25 text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 uppercase tracking-wider">Nové</span>
                  <h3 className="text-white text-xl font-bold mb-1">Vyhledávání podle VIN kódu</h3>
                  <p className="text-white/40 text-sm">Přesná identifikace dílů z originálních schémat</p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />

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
