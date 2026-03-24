import Header from "@/components/Header";
import Footer from "@/components/Footer";

const COURIER = [
  { name: "Zásilkovna", price: "99 Kč", limit: "do 15 kg", speed: "2–3 dny", color: "#10B981" },
  { name: "PPL výdejní místa", price: "99 Kč", limit: "do 30 kg", speed: "1–2 dny", color: "#3B82F6" },
  { name: "GLS výdejní místa", price: "99 Kč", limit: "do 20 kg", speed: "1–2 dny", color: "#3B82F6" },
  { name: "We|Do kurýr", price: "110 Kč", limit: "do 30 kg", speed: "1–2 dny", color: "#8B5CF6" },
  { name: "DPD kurýr", price: "od 129 Kč", limit: "do 30 kg", speed: "1–2 dny", color: "#8B5CF6" },
  { name: "GLS kurýr", price: "od 140 Kč", limit: "do 40 kg", speed: "1–2 dny", color: "#8B5CF6" },
  { name: "Česká pošta", price: "150 Kč", limit: "do 50 kg", speed: "2–4 dny", color: "#F59E0B" },
  { name: "PPL kurýr", price: "od 170 Kč", limit: "do 30 kg", speed: "1–2 dny", color: "#8B5CF6" },
  { name: "Fofr kurýr", price: "300 Kč", limit: "do 50 kg", speed: "do 24h", color: "#E8192C" },
  { name: "Doprava do EU", price: "300 Kč", limit: "vybrané země", speed: "3–7 dní", color: "#6366F1" },
  { name: "PPL nadrozměr", price: "700 Kč", limit: "baterie, výfuky", speed: "2–3 dny", color: "#F59E0B" },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <div className="bg-mlbg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
        <div className="relative max-w-[1000px] mx-auto px-4 lg:px-8 py-16 text-center">
          <span className="inline-flex items-center gap-1.5 bg-mlgreen/20 text-mlgreen text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-mlgreen rounded-full" />
            Nad 10 000 Kč zdarma
          </span>
          <h1 className="text-white text-4xl font-bold mb-3 tracking-tight">Doprava a platba</h1>
          <p className="text-white/40 text-base max-w-lg mx-auto">Vyberte si z 11 způsobů doručení — většinu objednávek expedujeme do 24 hodin</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-8">

          {/* Free shipping banner */}
          <div className="-mt-6 relative z-10 mb-10 bg-gradient-to-r from-mlgreen/10 to-mlgreen/5 border-2 border-mlgreen/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mlgreen/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-mlgreen" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <span className="block text-[15px] font-bold text-mltext-dark">Doprava zdarma nad 10 000 Kč</span>
              <span className="text-[13px] text-mltext-light">Platí pro všechny standardní přepravce po celé ČR a SR</span>
            </div>
          </div>

          {/* Shipping options */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-mltext-dark mb-5">Způsoby doručení</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COURIER.map(s => (
                <div key={s.name} className="bg-white rounded-xl border border-mlborder-light p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[14px] font-bold text-mltext-dark group-hover:text-primary transition-colors">{s.name}</span>
                    <span className="text-[15px] font-extrabold shrink-0" style={{ color: s.color }}>{s.price}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-mltext-light">
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      {s.limit}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {s.speed}
                    </span>
                  </div>
                </div>
              ))}
              {/* Personal pickup */}
              <div className="bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] rounded-xl border-2 border-primary/10 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[14px] font-bold text-mltext-dark">Osobní odběr</span>
                  <span className="text-[15px] font-extrabold text-primary">40 Kč</span>
                </div>
                <div className="text-[11px] text-mltext-light">
                  Bohumín · Ostrava · Havířov — manipulační poplatek
                </div>
              </div>
            </div>

            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              <span className="text-[13px] text-amber-800">
                <strong>Nadrozměrné zásilky:</strong> Baterie, výfuky a díly karoserie nelze zasílat standardními přepravci — zvolte PPL nadrozměr.
              </span>
            </div>
          </section>

          {/* Payment */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-mltext-dark mb-5">Platební metody</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: "Bankovní převod", desc: "Platba předem na účet FIO Banky. Expedice po připsání.", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z", detail: "2601353185 / 2010", color: "#3B82F6" },
                { title: "Dobírka", desc: "Platba hotově nebo kartou kurýrovi při převzetí zásilky.", icon: "M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z", detail: "Příplatek dle přepravce", color: "#F59E0B" },
                { title: "Platba kartou", desc: "Visa, MasterCard, Google Pay, Apple Pay — okamžitě online.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516", detail: "Bez příplatku", color: "#10B981" },
              ].map(p => (
                <div key={p.title} className="bg-white rounded-2xl border border-mlborder-light p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: p.color + "12" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: p.color }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                  </div>
                  <h3 className="text-[15px] font-bold text-mltext-dark mb-1">{p.title}</h3>
                  <p className="text-[13px] text-mltext-light mb-3">{p.desc}</p>
                  <span className="text-[11px] font-semibold text-mltext bg-gray-100 px-2 py-1 rounded">{p.detail}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-mltext-light">Platbu je třeba uhradit do 5 pracovních dnů. Všechny ceny jsou uvedeny včetně DPH.</p>
          </section>

          {/* International */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl border border-mlborder-light p-7">
              <h2 className="text-lg font-bold text-mltext-dark mb-4 flex items-center gap-2">
                <span className="text-lg">🌍</span> Mezinárodní platby
              </h2>
              <div className="space-y-2.5">
                {[
                  { currency: "CZK", bank: "FIO Banka", number: "2601353185 / 2010" },
                  { currency: "EUR", bank: "Revolut Bank", number: "LT383250078826381540" },
                  { currency: "PLN", bank: "ING Bank Śląski", number: "PL85105013441000009031418891" },
                ].map(a => (
                  <div key={a.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-lg bg-white border border-mlborder-light flex items-center justify-center text-[12px] font-extrabold text-mltext-dark">{a.currency}</span>
                      <span className="text-[13px] font-semibold text-mltext-dark">{a.bank}</span>
                    </div>
                    <span className="font-mono text-[12px] text-mltext-light">{a.number}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
