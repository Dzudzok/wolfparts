"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart";

interface CheckoutForm {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  ico: string;
  dic: string;
  // Delivery address (if different)
  useDeliveryAddress: boolean;
  dName: string;
  dStreet: string;
  dCity: string;
  dZip: string;
  // Order
  note: string;
}

const INITIAL_FORM: CheckoutForm = {
  name: "", street: "", city: "", zip: "", country: "CZ",
  phone: "", email: "", ico: "", dic: "",
  useDeliveryAddress: false,
  dName: "", dStreet: "", dCity: "", dZip: "",
  note: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [form, setForm] = useState<CheckoutForm>(INITIAL_FORM);
  const [step, setStep] = useState<"form" | "summary" | "sending" | "done" | "error">("form");
  const [orderResult, setOrderResult] = useState<{ orderNo: string; orderCount: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const set = (key: keyof CheckoutForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: key === "useDeliveryAddress" ? (e.target as HTMLInputElement).checked : e.target.value });

  function validateForm(): string | null {
    if (!form.name.trim()) return "Vyplňte jméno nebo název firmy";
    if (!form.street.trim()) return "Vyplňte ulici";
    if (!form.city.trim()) return "Vyplňte město";
    if (!form.zip.trim()) return "Vyplňte PSČ";
    if (!form.email.trim()) return "Vyplňte email";
    if (!form.phone.trim()) return "Vyplňte telefon";
    if (form.useDeliveryAddress) {
      if (!form.dName.trim()) return "Vyplňte jméno příjemce";
      if (!form.dStreet.trim()) return "Vyplňte ulici doručení";
      if (!form.dCity.trim()) return "Vyplňte město doručení";
      if (!form.dZip.trim()) return "Vyplňte PSČ doručení";
    }
    if (cart.items.length === 0) return "Košík je prázdný";
    return null;
  }

  function handleContinue() {
    const err = validateForm();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg("");
    setStep("summary");
  }

  async function handleSendOrder() {
    setStep("sending");
    setErrorMsg("");

    try {
      const userToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const customerJson: Record<string, string> = {
        n: form.name, s: form.street, c: form.city, z: form.zip,
        co: form.country, p: form.phone, e: form.email,
      };
      if (form.ico) customerJson.ico = form.ico;
      if (form.dic) customerJson.dic = form.dic;
      if (form.useDeliveryAddress) {
        customerJson.dn = form.dName;
        customerJson.ds = form.dStreet;
        customerJson.dc = form.dCity;
        customerJson.dz = form.dZip;
      }

      const res = await fetch("/api/order-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userToken ? { "x-user-token": userToken } : {}),
        },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ code: i.productCode, brand: i.brand, qty: i.qty })),
          userOrder: "WP-" + Date.now(),
          userNote: JSON.stringify(customerJson),
          customerInfo: {
            name: form.name,
            street: form.street,
            city: form.city,
            postcode: form.zip,
            countryCode: form.country,
            contactPhone: form.phone,
            contactEmail: form.email,
            taxID: form.ico,
            vatID: form.dic,
          },
          deliveryAddress: form.useDeliveryAddress ? {
            addressName: form.dName,
            street: form.dStreet,
            city: form.dCity,
            postalCode: form.dZip,
          } : undefined,
          note: form.note,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Chyba při odesílání objednávky");
        setStep("error");
        return;
      }

      setOrderResult({
        orderNo: data.items?.[0]?.order?.no || data.orderNo || "—",
        orderCount: cart.items.length,
      });
      cart.clearCart();
      setStep("done");
    } catch {
      setErrorMsg("Nepodařilo se odeslat objednávku. Zkuste to znovu.");
      setStep("error");
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header showSearch={false} />

      <main className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-8">

          {/* ═══ DONE ═══ */}
          {step === "done" && orderResult && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-mlgreen/10 flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-mlgreen" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-3xl font-bold text-mltext-dark mb-3">Objednávka odeslána!</h1>
              <p className="text-mltext-light text-lg mb-2">
                Číslo objednávky: <span className="font-bold text-mltext-dark">{orderResult.orderNo}</span>
              </p>
              <p className="text-mltext-light mb-8">
                {orderResult.orderCount} {orderResult.orderCount === 1 ? "položka" : orderResult.orderCount < 5 ? "položky" : "položek"} · potvrzení odešleme na <span className="font-semibold">{form.email}</span>
              </p>
              <div className="flex items-center justify-center gap-3">
                <a href="/" className="bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
                  Zpět na úvodní stránku
                </a>
              </div>
            </div>
          )}

          {/* ═══ ERROR ═══ */}
          {step === "error" && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              </div>
              <h1 className="text-2xl font-bold text-mltext-dark mb-3">Chyba</h1>
              <p className="text-mltext-light mb-6">{errorMsg}</p>
              <button onClick={() => setStep("summary")} className="bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
                Zkusit znovu
              </button>
            </div>
          )}

          {/* ═══ SENDING ═══ */}
          {step === "sending" && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-mlborder border-t-primary mx-auto mb-4" />
              <p className="text-mltext-light font-medium">Odesílám objednávku...</p>
            </div>
          )}

          {/* ═══ FORM ═══ */}
          {step === "form" && (
            <>
              <h1 className="text-2xl font-bold text-mltext-dark mb-6">Dokončení objednávky</h1>

              {cart.items.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-mltext-light text-lg mb-4">Košík je prázdný</p>
                  <a href="/" className="text-primary font-bold hover:text-primary-dark">← Zpět na úvodní stránku</a>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* LEFT — Form */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Billing */}
                    <div className="bg-white rounded-2xl border border-mlborder-light p-6">
                      <h2 className="text-lg font-bold text-mltext-dark mb-4">Fakturační údaje</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">Jméno / Firma *</label>
                          <input value={form.name} onChange={set("name")} className="ml-input w-full px-3" placeholder="Jan Novák nebo Firma s.r.o." />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">Ulice *</label>
                          <input value={form.street} onChange={set("street")} className="ml-input w-full px-3" placeholder="Vodičkova 33" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">Město *</label>
                          <input value={form.city} onChange={set("city")} className="ml-input w-full px-3" placeholder="Praha" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">PSČ *</label>
                          <input value={form.zip} onChange={set("zip")} className="ml-input w-full px-3" placeholder="11000" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">Email *</label>
                          <input type="email" value={form.email} onChange={set("email")} className="ml-input w-full px-3" placeholder="jan@email.cz" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">Telefon *</label>
                          <input value={form.phone} onChange={set("phone")} className="ml-input w-full px-3" placeholder="+420 777 888 999" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">IČO</label>
                          <input value={form.ico} onChange={set("ico")} className="ml-input w-full px-3" placeholder="Nepovinné" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-mltext-light mb-1">DIČ</label>
                          <input value={form.dic} onChange={set("dic")} className="ml-input w-full px-3" placeholder="Nepovinné" />
                        </div>
                      </div>
                    </div>

                    {/* Delivery address toggle */}
                    <div className="bg-white rounded-2xl border border-mlborder-light p-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.useDeliveryAddress} onChange={set("useDeliveryAddress")} className="w-5 h-5 rounded border-mlborder text-primary focus:ring-primary" />
                        <span className="text-[14px] font-semibold text-mltext-dark">Doručit na jinou adresu</span>
                      </label>

                      {form.useDeliveryAddress && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[12px] font-semibold text-mltext-light mb-1">Jméno příjemce *</label>
                            <input value={form.dName} onChange={set("dName")} className="ml-input w-full px-3" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[12px] font-semibold text-mltext-light mb-1">Ulice *</label>
                            <input value={form.dStreet} onChange={set("dStreet")} className="ml-input w-full px-3" />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-mltext-light mb-1">Město *</label>
                            <input value={form.dCity} onChange={set("dCity")} className="ml-input w-full px-3" />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-mltext-light mb-1">PSČ *</label>
                            <input value={form.dZip} onChange={set("dZip")} className="ml-input w-full px-3" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Note */}
                    <div className="bg-white rounded-2xl border border-mlborder-light p-6">
                      <label className="block text-[12px] font-semibold text-mltext-light mb-1">Poznámka k objednávce</label>
                      <textarea value={form.note} onChange={set("note")} rows={3} className="ml-input w-full px-3 py-2 h-auto resize-none" placeholder="Nepovinné" />
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">{errorMsg}</div>
                    )}
                  </div>

                  {/* RIGHT — Cart summary */}
                  <div>
                    <div className="bg-white rounded-2xl border border-mlborder-light p-5 sticky top-20">
                      <h2 className="text-lg font-bold text-mltext-dark mb-4">Vaše objednávka</h2>
                      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                        {cart.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-0.5" />
                              ) : (
                                <span className="text-[8px] font-bold text-mltext-light/30">{item.brand.slice(0, 3)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[12px] font-bold text-mltext-dark truncate">{item.name}</span>
                              <span className="text-[11px] text-mltext-light">{item.brand} · {item.qty}×</span>
                            </div>
                            {item.price && (
                              <span className="text-[13px] font-bold text-mltext-dark shrink-0">{(item.price * item.qty).toFixed(0)} Kč</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-mlborder-light pt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-mltext-light">Položek</span>
                          <span className="text-sm font-bold text-mltext-dark">{cart.count}</span>
                        </div>
                        {cart.total > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-mltext-light">Celkem bez DPH</span>
                            <span className="text-lg font-extrabold text-mltext-dark">{cart.total.toFixed(0)} Kč</span>
                          </div>
                        )}
                        <p className="text-[11px] text-mltext-light mt-2">* Konečná cena s DPH bude potvrzena</p>
                      </div>
                      <button
                        onClick={handleContinue}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-[15px] py-3.5 rounded-xl transition-all mt-4 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                      >
                        Pokračovat →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ SUMMARY ═══ */}
          {step === "summary" && (
            <>
              <button onClick={() => setStep("form")} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-semibold mb-5">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                Zpět k úpravám
              </button>
              <h1 className="text-2xl font-bold text-mltext-dark mb-6">Shrnutí objednávky</h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* Addresses */}
                  <div className="bg-white rounded-2xl border border-mlborder-light p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-[12px] font-bold text-mltext-light uppercase tracking-wider mb-2">Fakturační adresa</h3>
                      <p className="text-[14px] font-bold text-mltext-dark">{form.name}</p>
                      <p className="text-[13px] text-mltext">{form.street}</p>
                      <p className="text-[13px] text-mltext">{form.zip} {form.city}</p>
                      {form.ico && <p className="text-[12px] text-mltext-light mt-1">IČO: {form.ico}</p>}
                      {form.dic && <p className="text-[12px] text-mltext-light">DIČ: {form.dic}</p>}
                      <p className="text-[12px] text-mltext-light mt-2">{form.email} · {form.phone}</p>
                    </div>
                    <div>
                      <h3 className="text-[12px] font-bold text-mltext-light uppercase tracking-wider mb-2">Doručovací adresa</h3>
                      {form.useDeliveryAddress ? (
                        <>
                          <p className="text-[14px] font-bold text-mltext-dark">{form.dName}</p>
                          <p className="text-[13px] text-mltext">{form.dStreet}</p>
                          <p className="text-[13px] text-mltext">{form.dZip} {form.dCity}</p>
                        </>
                      ) : (
                        <p className="text-[13px] text-mltext-light">Stejná jako fakturační</p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-white rounded-2xl border border-mlborder-light overflow-hidden">
                    <div className="px-6 py-3 border-b border-mlborder-light bg-gray-50">
                      <span className="text-[13px] font-bold text-mltext-dark">{cart.count} {cart.count === 1 ? "položka" : cart.count < 5 ? "položky" : "položek"}</span>
                    </div>
                    {cart.items.map((item) => (
                      <div key={item.id} className="px-6 py-3 flex items-center gap-4 border-b border-mlborder-light last:border-0">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-mlborder-light flex items-center justify-center shrink-0 overflow-hidden">
                          {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-0.5" /> : <span className="text-[9px] font-bold text-mltext-light/30">{item.brand.slice(0, 3)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[14px] font-bold text-mltext-dark">{item.name}</span>
                          <span className="text-[12px] text-mltext-light">{item.brand} · {item.productCode} · {item.qty}×</span>
                        </div>
                        {item.price && <span className="text-[15px] font-bold text-mltext-dark">{(item.price * item.qty).toFixed(0)} Kč</span>}
                      </div>
                    ))}
                  </div>

                  {form.note && (
                    <div className="bg-white rounded-2xl border border-mlborder-light p-5">
                      <span className="text-[12px] font-semibold text-mltext-light">Poznámka:</span>
                      <p className="text-[13px] text-mltext mt-1">{form.note}</p>
                    </div>
                  )}
                </div>

                {/* Send button */}
                <div>
                  <div className="bg-white rounded-2xl border border-mlborder-light p-5 sticky top-20">
                    {cart.total > 0 && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-mltext-light">Celkem</span>
                        <span className="text-2xl font-extrabold text-mltext-dark">{cart.total.toFixed(0)} Kč</span>
                      </div>
                    )}
                    <button
                      onClick={handleSendOrder}
                      className="w-full bg-mlgreen hover:bg-green-600 text-white font-bold text-[15px] py-4 rounded-xl transition-all shadow-lg shadow-mlgreen/20 hover:shadow-xl"
                    >
                      Odeslat objednávku
                    </button>
                    <p className="text-[11px] text-mltext-light text-center mt-3">
                      Odesláním souhlasíte s obchodními podmínkami
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
