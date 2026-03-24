import { authenticateUser } from "@/lib/nextis-api";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth — login user via Nextis API
 * Body: { username, password }
 * Returns: { token, validTo } or { error }
 *
 * User token unlocks: personal prices, order placement, order history
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vyplňte uživatelské jméno a heslo" }, { status: 400 });
    }

    const result = await authenticateUser(username, password);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Chyba přihlášení";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
