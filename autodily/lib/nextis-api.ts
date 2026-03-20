import axios from "axios";

const BASE_URL = process.env.NEXTIS_API_URL || "https://api.mroauto.nextis.cz";

let cachedToken: string | null = null;
let tokenValidTo: Date | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken && tokenValidTo && new Date() < tokenValidTo) {
    return cachedToken;
  }

  const { data } = await axios.post(`${BASE_URL}/common/authentication`, {
    login: process.env.NEXTIS_API_LOGIN,
    password: process.env.NEXTIS_API_PASSWORD,
  });

  cachedToken = data.token;
  tokenValidTo = new Date(data.tokenValidTo);
  console.log(`Nextis token obtained, valid to: ${data.tokenValidTo}`);
  return cachedToken!;
}

// --- Types ---

export interface CatalogItem {
  ID: number;
  ProductCode: string;
  ProductName: string;
  ProductDescription: string;
  ProductBrand: string;
  QtyAvailableMain: number;
  QtyAvailableSupplier: number;
  Price: {
    UnitPrice: number;
    UnitPriceIncVAT: number;
    UnitPriceRetail: number;
    UnitPriceRetailIncVAT: number;
    Discount: number;
    VATRate: number;
    Currency: number;
    Valid: boolean;
  };
  OECodes: Array<{ Code: string; Manufacturer: string }>;
  BarCodes: string[];
  Valid: boolean;
}

export type SearchTarget = "CodeMain" | "CodeOE" | "CodeEAN";

// --- Catalog ---

export async function searchByCode(
  code: string,
  searchTarget: SearchTarget = "CodeMain"
): Promise<CatalogItem[]> {
  const token = await authenticate();
  const { data } = await axios.post(`${BASE_URL}/catalogs/items-checking`, {
    token,
    language: "cs",
    getEANCodes: true,
    getOECodes: true,
    items: [{ code, brand: "" }],
    searchTarget,
    trySearchWithoutManufacturer: true,
  });
  return (
    data.items
      ?.map((i: { responseItem: CatalogItem }) => i.responseItem)
      .filter((item: CatalogItem | null) => item && item.Valid) || []
  );
}

export async function searchMultiTarget(code: string): Promise<CatalogItem[]> {
  const targets: SearchTarget[] = ["CodeMain", "CodeOE", "CodeEAN"];
  const results = await Promise.allSettled(
    targets.map((target) => searchByCode(code, target))
  );

  const seen = new Set<number>();
  const items: CatalogItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        if (!seen.has(item.ID)) {
          seen.add(item.ID);
          items.push(item);
        }
      }
    }
  }

  return items;
}

export async function checkItemsByID(ids: number[]): Promise<CatalogItem[]> {
  const token = await authenticate();
  const { data } = await axios.post(`${BASE_URL}/catalogs/items-checking-by-id`, {
    token,
    language: "cs",
    getEANCodes: true,
    getOECodes: true,
    items: ids.map((id) => ({ id })),
  });
  return data.items?.map((i: { responseItem: CatalogItem }) => i.responseItem) || [];
}

// --- Orders ---

export interface OrderItem {
  code: string;
  brand: string;
  qty: number;
  userNote?: string;
  searchedFor?: string;
}

export async function validateOrder(items: OrderItem[]) {
  const token = await authenticate();
  const { data } = await axios.post(`${BASE_URL}/orders/validation`, {
    token,
    language: "cs",
    items: items.map((i) => ({
      code: i.code,
      brand: i.brand,
      qty: i.qty,
      userNote: i.userNote || "",
      searchedFor: i.searchedFor || i.code,
    })),
    orderType: 0,
    keepBackOrder: false,
    trySearchWithoutManufacturer: false,
  });
  return data;
}

export async function sendOrder(
  items: OrderItem[],
  userOrder?: string,
  userNote?: string
) {
  const token = await authenticate();
  const { data } = await axios.post(`${BASE_URL}/orders/sending`, {
    token,
    language: "cs",
    items: items.map((i) => ({
      code: i.code,
      brand: i.brand,
      qty: i.qty,
      info1: "",
      info2: "",
      info3: "",
    })),
    orderType: 0,
    keepBackOrder: true,
    separatedDocument: false,
    waitNextOrder: false,
    userNote: userNote || "",
    userOrder: userOrder || "",
    confirmOptionalPromotionItems: false,
  });
  return data;
}

export async function getPartnerInfo() {
  const token = await authenticate();
  const { data } = await axios.post(`${BASE_URL}/partners/info`, {
    token,
    language: "cs",
  });
  return data;
}
