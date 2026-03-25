"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regZip, setRegZip] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regIco, setRegIco] = useState("");
  const [regDic, setRegDic] = useState("");
  const [showCompany, setShowCompany] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token");
      const validTo = localStorage.getItem("auth_valid_to");
      if (token && validTo && new Date(validTo) > new Date()) router.push("/");
    } catch {}
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Vyplňte email a heslo"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: email, password }) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_valid_to", data.validTo);
      localStorage.setItem("auth_user", email);
      router.push("/");
    } catch { setError("Nepodařilo se připojit k serveru"); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim()) { setError("Vyplňte jméno"); return; }
    if (!regStreet.trim()) { setError("Vyplňte ulici"); return; }
    if (!regCity.trim()) { setError("Vyplňte město"); return; }
    if (!regZip.trim()) { setError("Vyplňte PSČ"); return; }
    if (!regEmail.includes("@")) { setError("Neplatný email"); return; }
    if (!regPhone.trim()) { setError("Vyplňte telefon"); return; }
    if (regPassword.length < 6) { setError("Heslo musí mít alespoň 6 znaků"); return; }
    if (regPassword !== regPasswordConfirm) { setError("Hesla se neshodují"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: regName, street: regStreet, city: regCity, zip: regZip, country: "CZ", phone: regPhone, email: regEmail, password: regPassword, ico: regIco, dic: regDic }) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_valid_to", data.validTo);
        localStorage.setItem("auth_user", regName);
        router.push("/");
      } else {
        setSuccess("Účet vytvořen! Přihlaste se za cca 1 minutu.");
        setTab("login"); setEmail(regEmail); setPassword(regPassword);
      }
    } catch { setError("Nepodařilo se provést registraci"); }
    finally { setLoading(false); }
  }

  const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-[13px] font-semibold text-mltext mb-1">{label}</label>
      <input {...props} className="w-full h-11 px-4 bg-white border border-mlborder rounded-lg text-[14px] text-mltext-dark font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-mltext-light/40" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col relative">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src="/hero-bg.png" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1117]/80 via-[#0F1117]/70 to-[#0F1117]" />
      </div>
      {/* Top bar */}
      <div className="p-5 relative z-10">
        <a href="/" className="inline-flex items-center gap-2 group">
          <img src="/logo.svg" alt="" className="w-8 h-8 rounded-lg" />
          <span className="text-white text-[16px] font-bold">Wolf<span className="text-primary-light">Parts</span></span>
        </a>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-white text-3xl font-bold mb-2">
              {tab === "login" ? "Vítejte zpět" : "Vytvořte si účet"}
            </h1>
            <p className="text-white/40 text-sm">
              {tab === "login" ? "Přihlaste se ke svému účtu" : "Registrace je rychlá a zdarma"}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/50 overflow-hidden relative z-10">
            {/* Tabs */}
            <div className="flex border-b border-mlborder">
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-all relative ${tab === "login" ? "text-primary" : "text-mltext-light hover:text-mltext"}`}
              >
                Přihlášení
                {tab === "login" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => { setTab("register"); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-all relative ${tab === "register" ? "text-primary" : "text-mltext-light hover:text-mltext"}`}
              >
                Registrace
                {tab === "register" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            </div>

            <div className="p-6">
              {success && (
                <div className="bg-mlgreen/10 border border-mlgreen/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-mltext-dark font-medium">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-mlgreen shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm font-medium">{error}</div>
              )}

              {/* ─── LOGIN ─── */}
              {tab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input label="Email / Login" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vas@email.cz" autoFocus />
                  <Input label="Heslo" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
                  <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50">
                    {loading ? "Přihlašuji..." : "Přihlásit se"}
                  </button>
                </form>
              )}

              {/* ─── REGISTER ─── */}
              {tab === "register" && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <Input label="Jméno / Firma *" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Jan Novák" />

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3"><Input label="Ulice *" value={regStreet} onChange={(e) => setRegStreet(e.target.value)} placeholder="Vodičkova 33" /></div>
                    <div className="col-span-2"><Input label="Město *" value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="Praha" /></div>
                    <Input label="PSČ *" value={regZip} onChange={(e) => setRegZip(e.target.value)} placeholder="11000" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Email *" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="vas@email.cz" />
                    <Input label="Telefon *" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+420 777..." />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Heslo *" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 znaků" />
                    <Input label="Heslo znovu *" type="password" value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} placeholder="Potvrďte" />
                  </div>

                  {/* Company toggle */}
                  <button type="button" onClick={() => setShowCompany(!showCompany)} className="text-[12px] text-primary font-semibold hover:text-primary-dark transition-colors">
                    {showCompany ? "− Skrýt firemní údaje" : "+ Firemní údaje (IČO, DIČ)"}
                  </button>

                  {showCompany && (
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 -mt-1">
                      <Input label="IČO" value={regIco} onChange={(e) => setRegIco(e.target.value)} placeholder="12345678" />
                      <Input label="DIČ" value={regDic} onChange={(e) => setRegDic(e.target.value)} placeholder="CZ12345678" />
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50">
                    {loading ? "Registruji..." : "Vytvořit účet"}
                  </button>

                  <p className="text-center text-[11px] text-mltext-light">
                    Registrací souhlasíte s{" "}
                    <a href="/obchodni-podminky" className="text-primary hover:underline">obchodními podmínkami</a>
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <a href="/" className="text-white/30 text-sm hover:text-white/60 transition-colors">
              ← Zpět na WolfParts
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
