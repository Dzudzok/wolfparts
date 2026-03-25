import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/nextis-api";

/**
 * POST /api/register
 *
 * Creates a new partner account. Uses the same flow as orders:
 * 1. Sends a minimal order on WolfParts account (884100) with REG marker
 * 2. TSQL task in Nextis creates the partner and cancels the order
 * 3. After ~1 min, user can login with their email + password
 *
 * For instant login: we try to authenticate immediately after sending.
 * If TSQL hasn't processed yet, we return success without token.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, street, city, zip, country, phone, email, password, ico, dic } = await req.json();

    if (!name || !email || !password || !street || !city || !zip || !phone) {
      return NextResponse.json({ error: "Vyplňte všechna povinná pole" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Heslo musí mít alespoň 6 znaků" }, { status: 400 });
    }

    // Build customer JSON (same format as order flow)
    const customerJson = JSON.stringify({
      n: name, s: street, c: city, z: zip, co: country || "CZ",
      p: phone, e: email, pw: password,
      ...(ico ? { ico } : {}),
      ...(dic ? { dic } : {}),
    });

    // Send registration as a special order on WolfParts account
    // TSQL task will: create partner, set password, cancel the "order"
    const axios = (await import("axios")).default;
    const BASE = process.env.NEXTIS_API_URL;
    const TOKEN = process.env.NEXTIS_TOKEN_ADMIN;
    const PID = parseInt(process.env.NEXTIS_DEFAULT_PARTNER_ID || "0");

    const res = await axios.post(`${BASE}/orders/sending`, {
      token: TOKEN,
      tokenIsMaster: true,
      tokenPartnerID: PID,
      language: "cs",
      keepBackOrder: true,
      userOrder: `WP-REG-${Date.now()}`,
      userNote: customerJson,
      subCustomerInfo: {
        name, street, city, postcode: zip, countryCode: country || "CZ",
        contactPhone: phone, contactEmail: email,
      },
      // Minimal item — will be cancelled by TSQL task
      items: [{ code: "REGISTRACE", brand: "SYSTEM", qty: 0 }],
    }, { timeout: 15000, validateStatus: () => true });

    // If order sending fails (no product "REGISTRACE"), try without items
    // Actually Nextis requires at least 1 valid item...
    // Alternative: just store in a different way

    if (res.status >= 400 || res.data?.status >= 400) {
      // Fallback: try sending with a real cheap product
      const res2 = await axios.post(`${BASE}/orders/sending`, {
        token: TOKEN,
        tokenIsMaster: true,
        tokenPartnerID: PID,
        language: "cs",
        keepBackOrder: true,
        userOrder: `WP-REG-${Date.now()}`,
        userNote: customerJson,
        subCustomerInfo: {
          name, street, city, postcode: zip, countryCode: country || "CZ",
          contactPhone: phone, contactEmail: email,
        },
        items: [{ code: "GDB1330", brand: "TRW", qty: 1 }],
      }, { timeout: 15000 });

      if (!res2.data?.items?.[0]?.order) {
        return NextResponse.json({ error: "Registrace se nezdařila. Zkuste to znovu." }, { status: 500 });
      }
    }

    // Try immediate login (may fail if TSQL hasn't processed yet)
    let token = null;
    let validTo = null;
    try {
      // Wait a moment for TSQL to potentially process
      await new Promise(r => setTimeout(r, 2000));
      const auth = await authenticateUser(email, password);
      token = auth.token;
      validTo = auth.validTo;
    } catch {
      // TSQL hasn't processed yet — that's OK
      // User will be able to login after ~1 min
    }

    return NextResponse.json({
      success: true,
      token,
      validTo,
      message: token
        ? "Účet vytvořen a přihlášen"
        : "Účet bude aktivován do 1 minuty. Poté se můžete přihlásit.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Chyba při registraci" }, { status: 500 });
  }
}
