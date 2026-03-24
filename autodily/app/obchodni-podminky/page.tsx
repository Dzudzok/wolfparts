import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SECTIONS = [
  { title: "1. Úvodní ustanovení", text: `Tyto obchodní podmínky upravují vzájemná práva a povinnosti prodávajícího a kupujícího vzniklé v souvislosti nebo na základě kupní smlouvy uzavřené prostřednictvím internetového obchodu wolfparts.cz.\n\nObchodní podmínky se vztahují na spotřebitele — fyzické osoby nakupující mimo svou podnikatelskou činnost. Pro podnikatelské subjekty platí individuální podmínky.` },
  { title: "2. Uzavření kupní smlouvy", text: "Objednávka se stává závaznou potvrzením prostřednictvím objednávkového systému. Kupní smlouva je uzavřena v okamžiku, kdy prodávající potvrdí přijetí objednávky e-mailem na adresu uvedenou kupujícím." },
  { title: "3. Ceny a platba", text: "Veškeré ceny uvedené na webových stránkách jsou konečné a zahrnují DPH. Prodávající si vyhrazuje právo změnit ceny bez předchozího upozornění.\n\nKupní cenu lze uhradit bankovním převodem (do 5 pracovních dnů), platbou na dobírku nebo online platební kartou." },
  { title: "4. Doručení zboží", text: "Prodávající nabízí více způsobů dopravy. Kupující je povinen zásilku při přebírání prohlédnout a případné poškození nahlásit přepravci do 24 hodin.\n\nPodrobné informace o dopravě a cenách naleznete na stránce Doprava a platba." },
  { title: "5. Odstoupení od smlouvy", text: "Spotřebitel má právo odstoupit od smlouvy bez udání důvodu ve lhůtě 14 dnů od převzetí zboží. Zboží musí být vráceno nepoužité, nepoškozené, v originálním obalu.\n\nPro odstoupení od smlouvy použijte formulář dostupný na stránce Soubory ke stažení." },
  { title: "6. Reklamace a záruka", text: "Záruční doba pro spotřebitele činí 24 měsíců, pro podnikatele 12 měsíců. Reklamaci lze uplatnit zasláním reklamačního protokolu spolu s reklamovaným zbožím na adresu centrálního skladu." },
  { title: "7. Ochrana osobních údajů", text: "Prodávající zpracovává osobní údaje kupujícího v souladu s nařízením GDPR. Údaje jsou využívány výhradně pro účely realizace objednávek a komunikace s kupujícím. Kupující má právo na přístup, opravu a výmaz svých osobních údajů." },
  { title: "8. Závěrečná ustanovení", text: "Tyto obchodní podmínky jsou platné a účinné od 1. 1. 2024. Prodávající si vyhrazuje právo podmínky měnit. Změněné podmínky budou zveřejněny na webových stránkách nejméně 14 dní před nabytím účinnosti." },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <div className="bg-mlbg py-14">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-white text-4xl font-bold mb-3 tracking-tight">Obchodní podmínky</h1>
          <p className="text-white/40 text-base">Platné od 1. 1. 2024</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-10">
          {/* Quick nav */}
          <div className="bg-white rounded-2xl border border-mlborder-light p-5 mb-8">
            <p className="text-[11px] font-bold text-mltext-light uppercase tracking-wider mb-3">Obsah</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECTIONS.map((s, i) => (
                <a key={i} href={`#section-${i}`} className="text-[12px] text-primary hover:text-primary-dark font-semibold transition-colors">
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-5">
            {SECTIONS.map((s, i) => (
              <div key={i} id={`section-${i}`} className="bg-white rounded-2xl border border-mlborder-light p-7 scroll-mt-20">
                <h2 className="text-[17px] font-bold text-mltext-dark mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-extrabold text-primary">{i + 1}</span>
                  {s.title.replace(/^\d+\.\s*/, "")}
                </h2>
                {s.text.split("\n\n").map((p, j) => (
                  <p key={j} className="text-[14px] text-mltext leading-relaxed mb-3 last:mb-0">{p}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { val: "14 dní", label: "na vrácení zboží", color: "#3B82F6" },
              { val: "24 měsíců", label: "záruční doba", color: "#10B981" },
              { val: "5 dní", label: "splatnost platby", color: "#F59E0B" },
            ].map(h => (
              <div key={h.label} className="bg-white rounded-xl border border-mlborder-light p-5 text-center">
                <span className="block text-2xl font-extrabold mb-0.5" style={{ color: h.color }}>{h.val}</span>
                <span className="text-[11px] text-mltext-light font-semibold uppercase tracking-wider">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
