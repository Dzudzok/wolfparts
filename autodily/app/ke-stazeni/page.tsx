import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FORMS = [
  { name: "Reklamační protokol", desc: "Formulář pro uplatnění reklamace vadného zboží", icon: "📋", color: "#E8192C" },
  { name: "Odstoupení od smlouvy", desc: "Vrácení zboží do 14 dnů bez udání důvodu", icon: "↩️", color: "#3B82F6" },
  { name: "Vrácení záloh a kaucí", desc: "Protokol pro vrácení zálohy na starý díl (výměnný program)", icon: "💰", color: "#10B981" },
  { name: "Přijetí DPF filtru", desc: "Podmínky a potvrzení o převzetí filtru k čištění", icon: "🔧", color: "#F59E0B" },
];

export default function DownloadsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <div className="bg-mlbg py-14">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-white text-4xl font-bold mb-3 tracking-tight">Soubory ke stažení</h1>
          <p className="text-white/40 text-base">Formuláře a dokumenty pro reklamace, vrácení a další</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-10">

          {/* Forms grid */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-mltext-dark mb-5">Formuláře ke stažení</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FORMS.map(doc => (
                <div key={doc.name} className="bg-white rounded-2xl border border-mlborder-light p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: doc.color + "10" }}>
                      {doc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-mltext-dark mb-1 group-hover:text-primary transition-colors">{doc.name}</h3>
                      <p className="text-[12px] text-mltext-light mb-3">{doc.desc}</p>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 text-[11px] font-bold bg-gray-100 hover:bg-primary/10 text-mltext-dark hover:text-primary px-3 py-1.5 rounded-lg transition-all">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                          PDF
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-bold bg-gray-100 hover:bg-primary/10 text-mltext-dark hover:text-primary px-3 py-1.5 rounded-lg transition-all">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                          DOC
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Online form */}
          <section className="mb-10">
            <div className="bg-gradient-to-r from-primary/[0.06] to-accent/[0.04] rounded-2xl border-2 border-primary/10 p-7 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-bold text-mltext-dark mb-1">Online formulář pro vrácení zboží</h3>
                <p className="text-[13px] text-mltext-light">Nechcete tisknout? Vyplňte formulář přímo online — bez PDF, rychle a jednoduše.</p>
              </div>
              <a href="/kontakt" className="bg-primary hover:bg-primary-dark text-white font-bold text-[12px] px-5 py-2.5 rounded-xl transition-all shrink-0 shadow-sm hover:shadow-md">
                Vyplnit online
              </a>
            </div>
          </section>

          {/* Info */}
          <section>
            <div className="bg-white rounded-2xl border border-mlborder-light p-7">
              <h2 className="text-lg font-bold text-mltext-dark mb-3">Kam zaslat formulář?</h2>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-mltext" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" /><path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
                </div>
                <div>
                  <p className="text-[14px] text-mltext-dark font-semibold">WolfParts — centrální sklad</p>
                  <p className="text-[13px] text-mltext-light">Bohumín, Česká republika</p>
                  <p className="text-[13px] text-mltext-light mt-1">Tel: +420 773 568 023 · E-mail: info@wolfparts.cz</p>
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
