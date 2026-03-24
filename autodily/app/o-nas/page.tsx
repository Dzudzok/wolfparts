import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      {/* Hero */}
      <div className="bg-mlbg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="relative max-w-[1000px] mx-auto px-4 lg:px-8 py-16 lg:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary-light text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Od roku 1994
          </span>
          <h1 className="text-white text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Váš spolehlivý partner<br />
            <span className="text-gradient">pro náhradní díly</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Více než 25 let zkušeností, 4 miliony dílů a tým odborníků připravených pomoci
          </p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-8 relative z-10 mb-14">
            {[
              { val: "4M+", label: "dílů v katalogu", color: "#E8192C" },
              { val: "200+", label: "výrobců", color: "#3B82F6" },
              { val: "25+", label: "let zkušeností", color: "#10B981" },
              { val: "24h", label: "doručení", color: "#F59E0B" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-mlborder-light p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.val}</span>
                <span className="text-[12px] text-mltext-light font-semibold uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Story */}
          <section className="mb-14">
            <div className="bg-white rounded-2xl border border-mlborder-light overflow-hidden">
              <div className="p-8 lg:p-10">
                <h2 className="text-2xl font-bold text-mltext-dark mb-4">Kdo jsme</h2>
                <p className="text-[15px] text-mltext leading-relaxed mb-4">
                  <strong className="text-mltext-dark">WolfParts</strong> je moderní online obchod s autodíly
                  působící na českém a slovenském trhu. Navazujeme na více než 25 let zkušeností v oboru —
                  od malého lokálního dodavatele jsme vyrostli v profesionální e-shop s jedním z největších
                  katalogů autodílů v České republice.
                </p>
                <p className="text-[15px] text-mltext leading-relaxed">
                  Naše portfolio pokrývá osobní i užitková vozidla — od originálních dílů přes kvalitní
                  aftermarket alternativy až po speciální komponenty. Díky přímým vazbám na přední světové
                  výrobce nabízíme nejlepší poměr cena/kvalita na trhu.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-mltext-dark mb-6 text-center">Co nás odlišuje</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0c1.21 0 2.382.18 3.482.516", title: "TecDoc katalog", desc: "Přesná identifikace dílů podle vozidla — interaktivní schémata, vyhledávání podle VIN kódu", color: "#3B82F6" },
                { icon: "M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1m8-1a1 1 0 0 1-1 1H9m4-1V8a1 1 0 0 1 1-1h2.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V16a1 1 0 0 1-1 1h-1m-6-1a1 1 0 0 0 1 1h1M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0", title: "Rychlé doručení", desc: "Většinu objednávek expedujeme do 24 hodin — DPD, PPL, GLS, Zásilkovna i Česká pošta", color: "#10B981" },
                { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "Konkurenční ceny", desc: "Přímé vazby na dodavatele — žádní prostředníci. Transparentní ceny bez skrytých poplatků", color: "#F59E0B" },
                { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15", title: "Záruka 2 roky", desc: "Snadné reklamace, vrácení zboží do 14 dnů bez udání důvodu, odborná zákaznická podpora", color: "#8B5CF6" },
              ].map(v => (
                <div key={v.title} className="bg-white rounded-2xl border border-mlborder-light p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: v.color + "12" }}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: v.color }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={v.icon} /></svg>
                  </div>
                  <h3 className="text-[16px] font-bold text-mltext-dark mb-2 group-hover:text-primary transition-colors">{v.title}</h3>
                  <p className="text-[13px] text-mltext-light leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-mltext-dark mb-6 text-center">Naše cesta</h2>
            <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
              {[
                { year: "1994", text: "Začátek podnikání — malý lokální dodavatel autodílů" },
                { year: "2019", text: "Otevření expresního autoservisu — opravy motorů, výměny olejů, automatické převodovky" },
                { year: "2021", text: "Investice do čištění DPF/FAP filtrů a ekologického zpracování obalů" },
                { year: "2024", text: "Spuštění WolfParts — moderní e-shop s TecDoc integrací a 4M+ dílů" },
              ].map(t => (
                <div key={t.year} className="relative">
                  <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-primary border-4 border-white shadow" />
                  <span className="inline-block text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-1">{t.year}</span>
                  <p className="text-[14px] text-mltext">{t.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-14">
            <div className="bg-mlbg rounded-2xl p-8 lg:p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-primary/15 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <h3 className="text-white text-2xl font-bold mb-3">Hledáte díl pro vaše auto?</h3>
                <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                  Vyberte vozidlo nebo vyhledejte díl podle kódu — pomůžeme vám najít přesně to, co potřebujete.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <a href="/" className="bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl">
                    Vyhledat díl
                  </a>
                  <a href="/kontakt" className="bg-white/10 hover:bg-white/15 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
                    Kontaktovat nás
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
