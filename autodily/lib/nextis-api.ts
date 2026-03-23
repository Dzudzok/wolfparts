import axios from "axios";

const BASE_URL = process.env.NEXTIS_API_URL || "https://api.mroauto.nextis.cz";

let cachedToken: string | null = null;
let tokenValidTo: Date | null = null;

export async function getToken(): Promise<string> {
  if (cachedToken && tokenValidTo && new Date() < tokenValidTo) {
    return cachedToken;
  }

  const res = await axios.post(`${BASE_URL}/common/authentication`, {
    login: process.env.NEXTIS_API_LOGIN,
    password: process.env.NEXTIS_API_PASSWORD,
  });

  cachedToken = res.data.token;
  tokenValidTo = new Date(res.data.tokenValidTo);
  return cachedToken!;
}

function baseRequest() {
  return { language: "cs" };
}

// Live ceny a stavy po ID
export async function checkItemsByID(ids: number[]) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/catalogs/items-checking-by-id`, {
    ...baseRequest(),
    token,
    getEANCodes: true,
    getOECodes: true,
    items: ids.map((id) => ({ id })),
  });
  return res.data.items || [];
}

// Walidace objednávky
export async function validateOrder(items: OrderItem[]) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/orders/validation`, {
    ...baseRequest(),
    token,
    keepBackOrder: true,
    items,
  });
  return res.data.items || [];
}

// Odeslání objednávky
export async function sendOrder(items: OrderItem[], userOrder?: string) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/orders/sending`, {
    ...baseRequest(),
    token,
    keepBackOrder: true,
    userOrder: userOrder || "",
    items,
  });
  return res.data;
}

// Údaje o partnerovi
export async function getPartnerInfo() {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/partners/info`, {
    ...baseRequest(),
    token,
  });
  return res.data;
}

// Hledání dílů podle kódu vozidla (items-finding-by-vehicle — vrací 500, čeká na opravu Nextis)
export async function findByVehicle(engineId: number, genArtId?: number) {
  const token = await getToken();
  const body: Record<string, unknown> = {
    ...baseRequest(),
    token,
    engineID: engineId,
    getEANCodes: true,
    getOECodes: true,
  };
  if (genArtId) body.genArtID = genArtId;

  const res = await axios.post(`${BASE_URL}/catalogs/items-finding-by-vehicle`, body);
  return res.data.items || [];
}

/**
 * Find compatible parts by product code + genArtID
 * Returns all replacements/alternatives from Nextis full catalog with live prices
 */
export async function findByCode(code: string, genArtID: number, target = "P") {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/catalogs/items-finding-by-code`, {
    ...baseRequest(),
    token,
    code,
    target,
    genArtID,
    getEANCodes: true,
    getOECodes: true,
  }, { timeout: 15000 });
  return res.data.items || [];
}

/**
 * Find parts by engineID (K-type) — uses items-finding-by-code with genArtID=0
 * Returns ALL parts for this engine from Nextis catalog
 */
export async function findByEngineId(engineId: number) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/catalogs/items-finding-by-code`, {
    ...baseRequest(),
    token,
    code: String(engineId),
    target: "P",
    genArtID: 0,
    getEANCodes: true,
    getOECodes: true,
  }, { timeout: 20000 });
  return res.data.items || [];
}

interface OrderItem {
  code: string;
  brand: string;
  qty: number;
}
