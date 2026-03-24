export default function Footer() {
  return (
    <footer className="bg-mlbg mt-auto">
      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.svg" alt="WolfParts" className="w-8 h-8 rounded-lg" />
              <span className="text-white font-bold text-lg tracking-tight">WolfParts</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed mb-5">
              Spolehlivý dodavatel autodílů pro váš vůz. Široký sortiment, rychlé doručení.
            </p>
            <div className="flex items-center gap-4">
              <a href="tel:+420722537981" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                +420 722 537 981
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white/70 font-bold text-xs uppercase tracking-widest mb-4">Nákup</h4>
            <div className="space-y-2.5">
              {[
                { label: "O nás", href: "/o-nas" },
                { label: "Doprava a platba", href: "/doprava" },
                { label: "Obchodní podmínky", href: "/obchodni-podminky" },
                { label: "Soubory ke stažení", href: "/ke-stazeni" },
                { label: "Kontakt", href: "/kontakt" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-white/30 text-sm hover:text-white/70 transition-colors">{l.label}</a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white/70 font-bold text-xs uppercase tracking-widest mb-4">Kategorie</h4>
            <div className="space-y-2.5">
              {["Brzdové díly", "Filtry", "Oleje", "Řemeny", "Spojky", "Tlumičy"].map((l) => (
                <a key={l} href={`/search?q=${l.toLowerCase()}`} className="block text-white/30 text-sm hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-white/70 font-bold text-xs uppercase tracking-widest mb-4">Proč my</h4>
            <div className="space-y-3">
              {[
                { icon: "M5 13l4 4L19 7", text: "4 000 000+ dílů" },
                { icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", text: "Doručení do 24h" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", text: "Ověřené díly" },
                { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15", text: "14 dnů na vrácení" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlgreen shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  <span className="text-white/40 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <span className="text-white/20 text-sm">© {new Date().getFullYear()} WolfParts</span>
          <div className="flex items-center gap-2">
            {["VISA", "MC", "GPay"].map((pm) => (
              <span key={pm} className="text-[9px] font-bold text-white/15 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-md uppercase tracking-wider">{pm}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
