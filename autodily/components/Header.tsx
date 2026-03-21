import SearchBox from "./SearchBox";

interface HeaderProps {
  initialQuery?: string;
  showSearch?: boolean;
  transparent?: boolean;
}

export default function Header({ initialQuery, showSearch = true, transparent = false }: HeaderProps) {
  const bg = transparent ? "bg-transparent absolute top-0 left-0 right-0" : "bg-mlbg";

  return (
    <header className={`${bg} sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.06]`}>
      <div className="max-w-[1400px] mx-auto">
        {/* Single row: Logo + Search + Nav */}
        <div className="h-16 flex items-center gap-6 px-4 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 flex items-center justify-center group-hover:shadow-primary/40 transition-all group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-white text-[17px] font-bold tracking-tight hidden sm:block">
              AUTO<span className="text-primary-light">DÍLY</span>
            </span>
          </a>

          {/* Search */}
          {showSearch && (
            <div className="flex-1 max-w-2xl">
              <SearchBox large initialQuery={initialQuery} />
            </div>
          )}

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {[
              { href: "/search?q=*", label: "Katalog" },
              { href: "/search?q=*&is_sale=true", label: "Akce", badge: true },
              { href: "/admin", label: "Admin" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative text-white/60 hover:text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all"
              >
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </a>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            <a href="#" className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-mlbg">0</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
