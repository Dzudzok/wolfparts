import axios from "axios";

const BASE_URL = process.env.NEXTIS_API_URL || "https://api.mroauto.nextis.cz";

let cachedToken: string | null = null;
let tokenValidTo: Date | null = null;

async function getToken(): Promise<string> {
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

// Live ceny i stany po ID
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

// Walidacja zamowienia
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

// Zlozenie zamowienia
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

// Dane partnera
export async function getPartnerInfo() {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/partners/info`, {
    ...baseRequest(),
    token,
  });
  return res.data;
}

interface OrderItem {
  code: string;
  brand: string;
  qty: number;
}
