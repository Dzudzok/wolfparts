import axios from "axios";

const BASE_URL = process.env.NEXTIS_API_URL || "https://api.mroauto.nextis.cz";
const ADMIN_TOKEN = process.env.NEXTIS_TOKEN_ADMIN || "";

// ─── Token Management ────────────────────────────────────

/**
 * Get master token — static admin token, no login needed.
 * Used for catalog browsing, stock checks when user is NOT logged in.
 */
export function getMasterToken(): string {
  return ADMIN_TOKEN;
}

const DEFAULT_PARTNER_ID = parseInt(process.env.NEXTIS_DEFAULT_PARTNER_ID || "0");

/**
 * Build base request params.
 * - userToken → uses user's token (their prices, their orders)
 * - no userToken → uses admin master token + default partner for catalog prices
 */
function buildTokenParams(userToken?: string) {
  if (userToken) {
    return { token: userToken, language: "cs" };
  }
  if (ADMIN_TOKEN && DEFAULT_PARTNER_ID > 0) {
    return { token: ADMIN_TOKEN, tokenIsMaster: true, tokenPartnerID: DEFAULT_PARTNER_ID, language: "cs" };
  }
  // Fallback: try login-based token (legacy)
  return { token: ADMIN_TOKEN, language: "cs" };
}

// ─── Catalog ─────────────────────────────────────────────

/**
 * Check items — live prices + stock.
 * With userToken: returns customer-specific prices (with discounts).
 * Without: returns catalog prices via master token.
 */
export async function checkItemsByID(ids: number[], userToken?: string) {
  const res = await axios.post(`${BASE_URL}/catalogs/items-checking-by-id`, {
    ...buildTokenParams(userToken),
    getEANCodes: true,
    getOECodes: true,
    items: ids.map((id) => ({ id })),
  }, { timeout: 15000 });
  return res.data.items || [];
}

/**
 * Check items by code + brand.
 */
export async function checkItemsByCode(items: Array<{ code: string; brand: string }>, userToken?: string) {
  const res = await axios.post(`${BASE_URL}/catalogs/items-checking-by-id`, {
    ...buildTokenParams(userToken),
    getEANCodes: true,
    getOECodes: true,
    items,
  }, { timeout: 15000 });
  return res.data.items || [];
}

/**
 * Find compatible parts by product code.
 */
export async function findByCode(code: string, genArtID: number, target = "P", userToken?: string) {
  const res = await axios.post(`${BASE_URL}/catalogs/items-finding-by-code`, {
    ...buildTokenParams(userToken),
    code,
    target,
    genArtID,
    getEANCodes: true,
    getOECodes: true,
  }, { timeout: 15000 });
  return res.data.items || [];
}

/**
 * Find parts by engineID (K-type).
 */
export async function findByEngineId(engineId: number, userToken?: string) {
  const res = await axios.post(`${BASE_URL}/catalogs/items-finding-by-code`, {
    ...buildTokenParams(userToken),
    code: String(engineId),
    target: "P",
    genArtID: 0,
    getEANCodes: true,
    getOECodes: true,
  }, { timeout: 20000 });
  return res.data.items || [];
}

// ─── Orders ──────────────────────────────────────────────

interface OrderItem {
  code: string;
  brand: string;
  qty: number;
}

/**
 * Validate order — checks stock availability.
 * MUST use customer token for proper validation.
 */
export async function validateOrder(items: OrderItem[], userToken?: string) {
  const res = await axios.post(`${BASE_URL}/orders/validation`, {
    ...buildTokenParams(userToken),
    keepBackOrder: true,
    items,
  }, { timeout: 15000 });
  return res.data.items || [];
}

/**
 * Send order — places actual order in Nextis ERP.
 * MUST use customer token so order goes to their account.
 */
export async function sendOrder(items: OrderItem[], userOrder?: string, userToken?: string) {
  const res = await axios.post(`${BASE_URL}/orders/sending`, {
    ...buildTokenParams(userToken),
    keepBackOrder: true,
    userOrder: userOrder || "",
    items,
  }, { timeout: 15000 });
  return res.data;
}

// ─── Partner Info ────────────────────────────────────────

export async function getPartnerInfo(userToken?: string) {
  const res = await axios.post(`${BASE_URL}/partners/info`, {
    ...buildTokenParams(userToken),
  }, { timeout: 10000 });
  return res.data;
}

// ─── Auth (for user login) ───────────────────────────────

/**
 * Authenticate user — returns their personal token.
 * This token gives access to their prices, orders, history.
 */
export async function authenticateUser(username: string, password: string) {
  const res = await axios.post(`${BASE_URL}/common/authentication`, {
    Login: username,
    Password: password,
  }, { timeout: 10000 });

  if (res.data.status === "OK" && res.data.token) {
    return {
      token: res.data.token,
      validTo: res.data.tokenValidTo,
    };
  }
  throw new Error(res.data.statusText || "Authentication failed");
}
