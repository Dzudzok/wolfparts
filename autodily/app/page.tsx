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
        {/* Background layers */}
        <div className="absolute inset-0">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-mlbg/80 via-mlbg/70 to-mlbg" />
        </div>
        {/* Decorative blobs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/[0.07] rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-accent/[0.05] rounded-full blur-[80px]" />

        <Header />

        <div className="relative max-w-[1200px] mx-auto px-4 lg:px-8 pt-10 lg:pt-16 pb-24 lg:pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left: text + stats */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-1.5 mb-5">
                <span className="w-2 h-2 bg-mlgreen rounded-full animate-pulse" />
                <span className="text-white/50 text-xs font-semibold">Nové: Vyhledávání podle VIN kódu</span>
              </div>

              <h1 className="text-white text-3xl sm:text-4xl lg:text-[50px] font-extrabold leading-[1.08] mb-5 tracking-tight">
                Najděte správný díl<br />
                <span className="text-gradient">pro vaše auto</span>
              </h1>
              <p className="text-white/40 text-base lg:text-lg max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                Originální i aftermarket díly od 200+ výrobců. Doručení do 24 hodin po celé ČR a SR.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8">
                {[
                  { value: "6M+", label: "dílů v nabídce" },
                  { value: "200+", label: "výrobců" },
                  { value: "24h", label: "doručení" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-8">
                    <div className="text-center lg:text-left">
                      <span className="block text-2xl lg:text-3xl font-black text-white tracking-tight">{stat.value}</span>
                      <span className="text-[11px] text-white/35 uppercase tracking-wider font-semibold">{stat.label}</span>
                    </div>
                    {i < 2 && <div className="w-px h-10 bg-white/[0.08]" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Vehicle picker card */}
            <div className="w-full lg:w-[440px] shrink-0">
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 p-6 lg:p-7 relative overflow-hidden">
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="flex items-center gap-3 mb-5 mt-1">
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
          <section className="-mt-12 relative z-10 mb-14">
            <div className="bg-white rounded-2xl shadow-lg shadow-black/[0.04] border border-mlborder-light p-6 lg:p-8">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-mltext-dark text-xl font-extrabold">Vyberte značku vozu</h2>
                  <p className="text-mltext-light text-sm mt-1">20 nejpopulárnějších značek nebo hledejte v katalogu</p>
                </div>
                <a href="/search?q=*" className="hidden sm:flex items-center gap-1.5 text-primary text-sm font-bold hover:text-primary-dark transition-colors group">
                  Všechny značky
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              </div>
              <BrandGrid />
            </div>
          </section>

          {/* ═══════════════ HOW IT WORKS ═══════════════ */}
          <section className="mb-14">
            <h2 className="text-mltext-dark text-xl font-extrabold text-center mb-2">Jak to funguje?</h2>
            <p className="text-mltext-light text-sm text-center mb-8">Správný díl za 3 kroky</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Vyberte vozidlo",
                  desc: "Zadejte značku, model a motorizaci nebo VIN kód",
                  icon: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 001 14v2c0 .6.4 1 1 1h2M7 17a2 2 0 100-4 2 2 0 000 4zM17 17a2 2 0 100-4 2 2 0 000 4z",
                  color: "#3B82F6",
                },
                {
                  step: "2",
                  title: "Najděte díl",
                  desc: "Procházejte kategorie nebo hledejte podle kódu",
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  color: "#E8192C",
                },
                {
                  step: "3",
                  title: "Objednejte",
                  desc: "Přidejte do košíku a obdržíte do 24 hodin",
                  icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
                  color: "#10B981",
                },
              ].map((item, i) => (
                <div key={item.step} className="relative bg-white rounded-2xl border border-mlborder-light p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px bg-mlborder z-10" />
                  )}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: item.color + "10" }}>
                    <svg viewBox="0 0 24 24" className="w-7 h-7" style={{ color: item.color }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black mb-2" style={{ backgroundColor: item.color + "10", color: item.color }}>{item.step}</span>
                  <h3 className="text-mltext-dark font-bold text-[15px] mb-1">{item.title}</h3>
                  <p className="text-mltext-light text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════ TRUST BAR ═══════════════ */}
          <section className="mb-14">
            <div className="bg-gradient-to-r from-mlbg via-[#141722] to-mlbg rounded-2xl p-6 lg:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: "M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1m8-1a1 1 0 0 1-1 1H9m4-1V8a1 1 0 0 1 1-1h2.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V16a1 1 0 0 1-1 1h-1m-6-1a1 1 0 0 0 1 1h1M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0", label: "Doručení do 24h", sub: "Po celé ČR a SR", color: "#10B981" },
                  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516", label: "Ověřené díly", sub: "TecDoc katalog", color: "#3B82F6" },
                  { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z", label: "Bezpečná platba", sub: "Kartou, převodem", color: "#8B5CF6" },
                  { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15", label: "Vrácení do 14 dnů", sub: "Bez udání důvodu", color: "#F59E0B" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + "15" }}>
                      <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: item.color }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-white text-[14px] font-bold leading-tight">{item.label}</span>
                      <span className="block text-white/35 text-[12px]">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════ CATEGORIES ═══════════════ */}
          <section className="mb-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-mltext-dark text-xl font-extrabold">Populární kategorie</h2>
                <p className="text-mltext-light text-sm mt-1">Nejčastěji hledané autodíly</p>
              </div>
            </div>
            <CategoryGrid />
          </section>

          {/* ═══════════════ PROMO ═══════════════ */}
          <section className="mb-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Promo 1: Oils */}
              <a href="/search?q=olej&is_sale=true" className="group relative rounded-2xl overflow-hidden bg-mlbg p-8 min-h-[200px] flex flex-col justify-end hover:shadow-2xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-mlbg via-mlbg/90 to-primary/20" />
                <div className="absolute top-0 right-0 w-56 h-56 bg-primary/15 rounded-full blur-[80px] group-hover:bg-primary/25 transition-all" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary-light text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    Akce
                  </span>
                  <h3 className="text-white text-2xl font-extrabold mb-2 group-hover:text-primary-light transition-colors">Motorové oleje se slevou až 30%</h3>
                  <p className="text-white/40 text-sm">Castrol, Mobil, Shell a další premium značky</p>
                </div>
              </a>

              {/* Promo 2: VIN */}
              <a href="/vin" className="group relative rounded-2xl overflow-hidden bg-mlbg p-8 min-h-[200px] flex flex-col justify-end hover:shadow-2xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-mlbg via-mlbg/90 to-blue-500/20" />
                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/15 rounded-full blur-[80px] group-hover:bg-blue-500/25 transition-all" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Nové
                  </span>
                  <h3 className="text-white text-2xl font-extrabold mb-2 group-hover:text-blue-300 transition-colors">Vyhledávání podle VIN kódu</h3>
                  <p className="text-white/40 text-sm">Přesná identifikace dílů z originálních schémat vozidla</p>
                </div>
              </a>
            </div>
          </section>

          {/* ═══════════════ BRANDS MARQUEE ═══════════════ */}
          <section className="mb-14">
            <p className="text-center text-mltext-light text-xs font-bold uppercase tracking-widest mb-5">Dodáváme díly od výrobců</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-40">
              {["BOSCH", "SACHS", "TRW", "VALEO", "LUK", "MANN-FILTER", "NGK", "GATES", "SKF", "BREMBO", "DAYCO", "FEBI"].map((brand) => (
                <span key={brand} className="text-[13px] font-black text-mltext-dark uppercase tracking-wider">{brand}</span>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Chat button */}
      <div className="fixed bottom-5 right-5 z-50">
        <button className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 group">
          <svg viewBox="0 0 24 24" className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
