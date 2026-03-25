"use client";

import { useState } from "react";

interface LoginModalProps {
  onLogin: (token: string) => void;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_valid_to", data.validTo);
        localStorage.setItem("auth_user", username);
        onLogin(data.token);
      }
    } catch {
      setError("Nepodařilo se připojit k serveru");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-mlbg p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold">Přihlášení</h2>
            <p className="text-white/40 text-sm mt-1">Pro přístup k VIN vyhledávání a objednávkám</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-mltext-dark mb-1.5">Uživatelské jméno</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Zadejte login"
              autoFocus
              className="w-full bg-gray-50 border-2 border-mlborder rounded-xl px-4 py-3 text-sm font-medium text-mltext-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-mltext-dark mb-1.5">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadejte heslo"
              className="w-full bg-gray-50 border-2 border-mlborder rounded-xl px-4 py-3 text-sm font-medium text-mltext-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Přihlašuji...
              </span>
            ) : (
              "Přihlásit se"
            )}
          </button>

          <p className="text-center text-[13px] text-mltext-light mt-1">
            Nemáte účet?{" "}
            <a href="/registrace" className="text-primary font-bold hover:text-primary-dark transition-colors">
              Zaregistrujte se
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
