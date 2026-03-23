/**
 * Auto-fetches TecDoc API key from mroauto.cz
 * Key rotates periodically — we cache it and refresh when needed
 */

import axios from "axios";

let cachedKey: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 min — refresh before it rotates
const FALLBACK_KEY = "2BeBXg67wzbzFCs4QjwPEUsEm5Xq3Hq37sNWymUuuMXDp2BQU3Tc";

export async function getTecDocApiKey(): Promise<string> {
  if (cachedKey && Date.now() - cachedAt < CACHE_TTL) {
    return cachedKey;
  }

  try {
    const { data: html } = await axios.get(
      "https://www.mroauto.cz/cs/katalog/tecdoc/osobni/skoda/octavia-1u2/1-4/olejovy-filtr/106/1904/14748/100259/?path=100005~100259",
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        timeout: 10000,
      }
    );

    const match = html.match(/api_key=([A-Za-z0-9]{40,})/);
    if (match) {
      cachedKey = match[1];
      cachedAt = Date.now();
      return cachedKey;
    }
  } catch {
    // mroauto fetch failed
  }

  // Return cached or fallback
  return cachedKey || FALLBACK_KEY;
}

/**
 * Force refresh — call when API returns 401
 */
export function invalidateKey(): void {
  cachedAt = 0;
}
