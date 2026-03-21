import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/auth — login via Nextis API
 * Body: { username, password }
 * Returns: { token, validTo } or { error }
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vyplňte uživatelské jméno a heslo" }, { status: 400 });
    }

    const res = await axios.post(`${process.env.NEXTIS_API_URL}/common/authentication`, {
      Login: username,
      Password: password,
    }, { timeout: 10000 });

    if (res.data.status === "OK" && res.data.token) {
      return NextResponse.json({
        token: res.data.token,
        validTo: res.data.tokenValidTo,
      });
    }

    return NextResponse.json({ error: "Neplatné přihlašovací údaje" }, { status: 401 });
  } catch (err: any) {
    const msg = err.response?.data?.statusText || err.message || "Chyba přihlášení";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
