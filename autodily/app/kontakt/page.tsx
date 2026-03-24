import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LOCATIONS = [
  { name: "Centrální sklad Bohumín", address: "Bohumín 735 51", phone: "+420 777 224 210", hours: "Po–Pá 7:30–16:00\nSo 7:00–12:00", main: true },
  { name: "Pobočka Ostrava", address: "Ostrava-Zábřeh 700 30", phone: "+420 774 451 758", hours: "Po–Pá 8:00–16:00" },
  { name: "Pobočka Havířov", address: "Havířov 735 64", phone: "+420 608 246 721", hours: "Po–Pá 8:00–16:00" },
];

const DEPTS = [
  { label: "Objednávky a poradenství", phone: "+420 773 568 023", hours: "Po–Pá 7:30–16:00", icon: "M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z", color: "#E8192C" },
  { label: "Logistika a doručení", phone: "+420 774 917 859", hours: "Po–Pá 7:30–15:30", icon: "M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1m8-1a1 1 0 0 1-1 1H9m4-1V8a1 1 0 0 1 1-1h2.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V16a1 1 0 0 1-1 1h-1m-6-1a1 1 0 0 0 1 1h1M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0", color: "#3B82F6" },
  { label: "Autoservis", phone: "+420 778 082 405", hours: "Po–Pá 8:00–16:00", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0", color: "#10B981" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <div className="bg-mlbg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-primary/5" />
        <div className="relative max-w-[1000px] mx-auto px-4 lg:px-8 py-16 text-center">
          <h1 className="text-white text-4xl font-bold mb-3 tracking-tight">Kontaktujte nás</h1>
          <p className="text-white/40 text-base max-w-lg mx-auto">Jsme tu pro vás — napište, zavolejte nebo navštivte naši pobočku</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-8">

          {/* Quick contact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 -mt-8 relative z-10 mb-12">
            <a href="mailto:info@wolfparts.cz" className="bg-white rounded-2xl border border-mlborder-light p-6 flex items-center gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>
              </div>
              <div>
                <span className="block text-[11px] text-mltext-light font-semibold uppercase tracking-wider mb-0.5">E-mail</span>
                <span className="block text-[18px] font-bold text-primary">info@wolfparts.cz</span>
              </div>
            </a>
            <a href="tel:+420773568023" className="bg-white rounded-2xl border border-mlborder-light p-6 flex items-center gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-mlgreen/10 flex items-center justify-center shrink-0 group-hover:bg-mlgreen/15 transition-colors">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-mlgreen" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </div>
              <div>
                <span className="block text-[11px] text-mltext-light font-semibold uppercase tracking-wider mb-0.5">Telefon</span>
                <span className="block text-[18px] font-bold text-mltext-dark">+420 773 568 023</span>
                <span className="text-[11px] text-mltext-light">Po–Pá 7:30–16:00</span>
              </div>
            </a>
          </div>

          {/* Departments */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-mltext-dark mb-5">Oddělení</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DEPTS.map(d => (
                <div key={d.label} className="bg-white rounded-2xl border border-mlborder-light p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: d.color + "12" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: d.color }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d.icon} /></svg>
                  </div>
                  <h3 className="text-[14px] font-bold text-mltext-dark mb-1">{d.label}</h3>
                  <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="block text-[15px] font-bold text-primary hover:text-primary-dark transition-colors mb-1">{d.phone}</a>
                  <span className="text-[11px] text-mltext-light">{d.hours}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Locations */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-mltext-dark mb-5">Pobočky a osobní odběr</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LOCATIONS.map(loc => (
                <div key={loc.name} className={`rounded-2xl p-6 relative ${loc.main ? "bg-mlbg text-white" : "bg-white border border-mlborder-light"}`}>
                  {loc.main && (
                    <span className="absolute top-4 right-4 text-[9px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">Hlavní</span>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${loc.main ? "bg-white/10" : "bg-gray-100"}`}>
                    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${loc.main ? "text-white" : "text-mltext"}`} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" /><path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
                  </div>
                  <h3 className={`text-[15px] font-bold mb-1 ${loc.main ? "text-white" : "text-mltext-dark"}`}>{loc.name}</h3>
                  <p className={`text-[12px] mb-3 ${loc.main ? "text-white/50" : "text-mltext-light"}`}>{loc.address}</p>
                  <a href={`tel:${loc.phone.replace(/\s/g, "")}`} className={`block text-[14px] font-bold mb-2 ${loc.main ? "text-primary-light" : "text-primary"}`}>{loc.phone}</a>
                  <p className={`text-[11px] whitespace-pre-line ${loc.main ? "text-white/40" : "text-mltext-light"}`}>{loc.hours}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bank accounts */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl border border-mlborder-light p-7">
              <h2 className="text-lg font-bold text-mltext-dark mb-5 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-mltext-light" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" /></svg>
                Bankovní spojení
              </h2>
              <div className="space-y-2.5">
                {[
                  { curr: "CZK", bank: "FIO Banka", num: "2601353185 / 2010", flag: "🇨🇿" },
                  { curr: "EUR", bank: "Revolut Bank", num: "LT383250078826381540", flag: "🇪🇺" },
                  { curr: "PLN", bank: "ING Bank Śląski", num: "PL85105013441000009031418891", flag: "🇵🇱" },
                ].map(a => (
                  <div key={a.curr} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{a.flag}</span>
                      <div>
                        <span className="block text-[13px] font-bold text-mltext-dark">{a.curr}</span>
                        <span className="text-[11px] text-mltext-light">{a.bank}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[12px] text-mltext-light bg-white px-3 py-1.5 rounded-lg border border-mlborder-light">{a.num}</span>
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
