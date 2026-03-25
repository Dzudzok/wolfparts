"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface RegForm {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  ico: string;
  dic: string;
}

const INITIAL: RegForm = {
  name: "", street: "", city: "", zip: "", country: "CZ",
  phone: "", email: "", password: "", passwordConfirm: "",
  ico: "", dic: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (key: keyof RegForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  function validate(): string | null {
    if (!form.name.trim()) return "Vyplňte jméno nebo název firmy";
    if (!form.street.trim()) return "Vyplňte ulici";
    if (!form.city.trim()) return "Vyplňte město";
    if (!form.zip.trim()) return "Vyplňte PSČ";
    if (!form.email.trim()) return "Vyplňte email";
    if (!form.email.includes("@")) return "Neplatný email";
    if (!form.phone.trim()) return "Vyplňte telefon";
    if (form.password.length < 6) return "Heslo musí mít alespoň 6 znaků";
    if (form.password !== form.passwordConfirm) return "Hesla se neshodují";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          street: form.street,
          city: form.city,
          zip: form.zip,
          country: form.country,
          phone: form.phone,
          email: form.email,
          password: form.password,
          ico: form.ico,
          dic: form.dic,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Chyba při registraci");
        return;
      }

      // Auto-login
      if (data.token) {
        try {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("auth_valid_to", data.validTo);
          localStorage.setItem("auth_user", form.name);
        } catch {}
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Nepodařilo se provést registraci");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header showSearch={false} />

      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-[520px] mx-auto px-4">

          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-mlgreen/10 flex items-center justify-center mx-auto mb-5">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-mlgreen" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-2xl font-bold text-mltext-dark mb-2">Registrace úspěšná!</h1>
              <p className="text-mltext-light mb-4">Váš účet byl vytvořen. Přesměrováváme...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-mltext-dark">Vytvořit účet</h1>
                <p className="text-mltext-light text-sm mt-1">
                  Zaregistrujte se pro přístup k velkoobchodním cenám a historii objednávek
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-mlborder-light p-6 space-y-5">

                {/* Company / Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-mltext-light mb-1">Jméno / Firma *</label>
                  <input value={form.name} onChange={set("name")} className="ml-input w-full px-3" placeholder="Jan Novák nebo Firma s.r.o." />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[12px] font-semibold text-mltext-light mb-1">Ulice *</label>
                  <input value={form.street} onChange={set("street")} className="ml-input w-full px-3" placeholder="Vodičkova 33" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">Město *</label>
                    <input value={form.city} onChange={set("city")} className="ml-input w-full px-3" placeholder="Praha" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">PSČ *</label>
                    <input value={form.zip} onChange={set("zip")} className="ml-input w-full px-3" placeholder="11000" />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={set("email")} className="ml-input w-full px-3" placeholder="jan@email.cz" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">Telefon *</label>
                    <input value={form.phone} onChange={set("phone")} className="ml-input w-full px-3" placeholder="+420 777 888 999" />
                  </div>
                </div>

                {/* IČO / DIČ */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">IČO</label>
                    <input value={form.ico} onChange={set("ico")} className="ml-input w-full px-3" placeholder="Nepovinné" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">DIČ</label>
                    <input value={form.dic} onChange={set("dic")} className="ml-input w-full px-3" placeholder="Nepovinné" />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">Heslo *</label>
                    <input type="password" value={form.password} onChange={set("password")} className="ml-input w-full px-3" placeholder="Min. 6 znaků" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-mltext-light mb-1">Heslo znovu *</label>
                    <input type="password" value={form.passwordConfirm} onChange={set("passwordConfirm")} className="ml-input w-full px-3" placeholder="Potvrďte heslo" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-[15px] py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {loading ? "Registruji..." : "Vytvořit účet"}
                </button>

                <p className="text-center text-[12px] text-mltext-light">
                  Již máte účet?{" "}
                  <button type="button" onClick={() => {/* TODO: open login modal */}} className="text-primary font-bold hover:text-primary-dark">
                    Přihlaste se
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
