"use client";

import { useState, useEffect } from "react";
import SearchBox from "./SearchBox";
import LoginModal from "./LoginModal";

interface HeaderProps {
  initialQuery?: string;
  showSearch?: boolean;
}

export default function Header({ initialQuery, showSearch = true }: HeaderProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem("auth_token");
      const validTo = localStorage.getItem("auth_valid_to");
      const name = localStorage.getItem("auth_user");
      if (token && validTo && new Date(validTo) > new Date()) {
        setUser(name);
      }
    } catch {}
  }, []);

  function handleLogin() {
    try { setUser(localStorage.getItem("auth_user")); } catch {}
    setShowLogin(false);
  }

  function handleLogout() {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_valid_to");
      localStorage.removeItem("auth_user");
    } catch {}
    setUser(null);
  }

  return (
    <>
      <header className="bg-mlbg sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <div className="h-16 flex items-center gap-6 px-4 lg:px-8">
            {/* Logo — WolfParts */}
            <a href="/" className="flex items-center gap-2.5 shrink-0 group">
              <img src="/logo.svg" alt="WolfParts" className="w-9 h-9 rounded-xl shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all group-hover:scale-105" />
              <span className="text-white text-[17px] font-bold tracking-tight hidden sm:block">
                Wolf<span className="text-primary-light">Parts</span>
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
                { href: "/vin", label: "VIN" },
                { href: "/search?q=*&is_sale=true", label: "Akce", badge: true },
                { href: "/admin", label: "Admin" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="relative text-white/60 hover:text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all"
                >
                  {item.label}
                  {item.badge && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
                </a>
              ))}
            </nav>

            {/* User + Cart */}
            <div className="flex items-center gap-1 shrink-0">
              {/* User button */}
              {mounted && user ? (
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs font-semibold hidden md:block">{user}</span>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-mlgreen hover:bg-white/[0.06] transition-all"
                    title="Odhlásit"
                  >
                    <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                  title="Přihlásit se"
                >
                  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
              )}

              {/* Cart */}
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

      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
    </>
  );
}
