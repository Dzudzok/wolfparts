/**
 * Placeholder for mroauto.cz session management
 * VIN search via Puppeteer is disabled for now (requires Chrome)
 */

export interface VinVehicle {
  name: string; model: string; engine: string; engineCode: string;
  years: string; gearbox: string; url: string;
}

export interface VinCategory {
  name: string; url: string; isGroup: boolean;
}

export interface VinOePart {
  position: string; oe: string; name: string; url: string;
}

export interface VinProduct {
  brand: string; code: string; name: string; imageUrl: string;
  price: string; priceNoVat: string; stock: string; deliveryInfo: string;
}

export async function searchVin(_vin: string): Promise<VinVehicle[]> {
  throw new Error("VIN search is not available — Puppeteer not installed");
}

export async function getVinCategories(_url: string): Promise<VinCategory[]> {
  throw new Error("VIN categories not available — Puppeteer not installed");
}

export async function getVinParts(_url: string): Promise<{ oes: VinOePart[]; products: VinProduct[]; title: string }> {
  throw new Error("VIN parts not available — Puppeteer not installed");
}
