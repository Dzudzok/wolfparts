/**
 * TecAlliance TecDoc Pegasus 3.0 API client
 * Full replacement for mroauto.cz scraping
 */

import axios from "axios";

const API_KEY = "2BeBXg67wzbzFCs4QjwPEUsEm5Xq3Hq37sDNBnUG71QY2AKCkwBv";
const ENDPOINT = `https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatDLB.jsonEndpoint?api_key=${API_KEY}`;
const PROVIDER = 415;

// Simple in-memory cache to reduce API calls
const apiCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function call<T>(operation: string, params: Record<string, unknown>): Promise<T> {
  const cacheKey = operation + JSON.stringify(params);
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }

  const body: Record<string, unknown> = {};
  body[operation] = { provider: PROVIDER, ...params };
  const { data } = await axios.post(ENDPOINT, body, {
    headers: { "Content-Type": "application/json" },
    timeout: 20000,
  });
  if (data.status && data.status !== 200 && data.status !== 400) {
    throw new Error(`TecDoc ${operation}: ${data.statusText || data.status}`);
  }

  apiCache.set(cacheKey, { data, ts: Date.now() });
  if (apiCache.size > 5000) {
    const entries = [...apiCache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 1000; i++) apiCache.delete(entries[i][0]);
  }

  return data;
}

// ─── Types ────────────────────────────────────────────────

export interface TecDocManufacturer {
  manuId: number;
  manuName: string;
  favorFlag?: number;
}

export interface TecDocModelSeries {
  modelId: number;
  modelName: string;
  yearOfConstFrom?: number;
  yearOfConstTo?: number;
  favorFlag?: number;
}

export interface TecDocVehicle {
  carId: number;
  carName: string;
  yearOfConstFrom?: number;
  yearOfConstTo?: number;
  powerKwFrom?: number;
  powerKwTo?: number;
  powerHpFrom?: number;
  powerHpTo?: number;
  fuelType?: string;
  engineCodes?: string;
  bodyType?: string;
  driveType?: string;
  cylinders?: number;
  capacityCcm?: number;
}

export interface TecDocCategoryNode {
  assemblyGroupNodeId: number;
  assemblyGroupName: string;
  hasChilds: boolean;
  parentNodeId?: number;
  sortNo?: number;
}

export interface TecDocImage {
  imageURL200: string;
  imageURL400: string;
  imageURL800: string;
  imageURL1600?: string;
  imageURL3200?: string;
  fileName: string;
  typeDescription: string;
  sortNumber: number;
}

export interface TecDocCriterion {
  criteriaId: number;
  criteriaDescription: string;
  criteriaUnitDescription?: string;
  rawValue: string;
  formattedValue: string;
}

export interface TecDocPdf {
  url: string;
  fileName: string;
  headerDescription: string;
}

export interface TecDocGenericArticle {
  genericArticleId: number;
  genericArticleDescription: string;
  assemblyGroupName: string;
  assemblyGroupNodeId: number;
}

export interface TecDocArticle {
  dataSupplierId: number;
  articleNumber: string;
  mfrName: string;
  images: TecDocImage[];
  articleCriteria: TecDocCriterion[];
  pdfs: TecDocPdf[];
  genericArticles: TecDocGenericArticle[];
  oeNumbers: Array<{ oeNumber: string; mfrName: string }>;
  comparableNumbers: Array<{ comparableNumber: string; mfrName: string }>;
}

export interface TecDocLinkedArticle {
  dataSupplierId: number;
  articleNumber: string;
  mfrName: string;
  genericArticleDescription: string;
  images?: TecDocImage[];
  articleCriteria?: TecDocCriterion[];
}

// ─── Vehicle Manufacturers / Models / Engines ─────────────

/**
 * Get car brands (manufacturers)
 */
export async function getManufacturers(): Promise<TecDocManufacturer[]> {
  const data = await call<{ data: { array: TecDocManufacturer[] } }>(
    "getManufacturers2",
    { country: "cz", lang: "cs", linkingTargetType: "V", favouredList: 1 }
  );
  return data.data?.array || [];
}

/**
 * Get model series for a manufacturer
 */
export async function getModelSeries(manuId: number): Promise<TecDocModelSeries[]> {
  const data = await call<{ data: { array: Array<{ modelId: number; modelname: string; yearOfConstrFrom?: number; yearOfConstrTo?: number; favorFlag?: number }> } }>(
    "getModelSeries2",
    { country: "cz", lang: "cs", manuId, favouredList: 1, linkingTargetType: "V" }
  );
  return (data.data?.array || []).map((m) => ({
    modelId: m.modelId,
    modelName: m.modelname, // API returns lowercase 'n'
    yearOfConstFrom: m.yearOfConstrFrom,
    yearOfConstTo: m.yearOfConstrTo,
  }));
}

/**
 * Get vehicles (engines) for a model series
 */
export async function getVehicles(manuId: number, modelId: number): Promise<TecDocVehicle[]> {
  // Step 1: Get car IDs
  const data = await call<{ data: { array: Array<{ carId: number; carName: string }> } }>(
    "getVehicleIdsByCriteria",
    { country: "cz", lang: "cs", manuId, modId: modelId, linkingTargetType: "V", countriesCarSelection: "cz", carType: "P" }
  );
  const ids = (data.data?.array || []).map((v) => v.carId);
  if (ids.length === 0) return [];

  // Step 2: Get full details for all IDs
  const details = await call<{ data: { array: Array<{ carId: number; vehicleDetails: RawVehicleDetails }> } }>(
    "getVehicleByIds4",
    { country: "cz", lang: "cs", articleCountry: "cz", countriesCarSelection: "cz", carIds: { array: ids } }
  );

  return (details.data?.array || []).map((v) => {
    const d = v.vehicleDetails || {};
    return {
      carId: v.carId,
      carName: d.typeName || String(v.carId),
      yearOfConstFrom: d.yearOfConstrFrom,
      yearOfConstTo: d.yearOfConstrTo,
      powerKwFrom: d.powerKwFrom,
      powerKwTo: d.powerKwTo,
      powerHpFrom: d.powerHpFrom,
      powerHpTo: d.powerHpTo,
      fuelType: d.fuelType,
      engineCodes: d.motorType,
      bodyType: d.constructionType,
      driveType: d.impulsionType,
      cylinders: d.cylinder,
      capacityCcm: d.cylinderCapacityCcm,
    };
  });
}

// Raw response shape from getVehicleByIds4
interface RawVehicleDetails {
  typeName?: string;
  yearOfConstrFrom?: number;
  yearOfConstrTo?: number;
  powerKwFrom?: number;
  powerKwTo?: number;
  powerHpFrom?: number;
  powerHpTo?: number;
  fuelType?: string;
  motorType?: string;
  constructionType?: string;
  impulsionType?: string;
  cylinder?: number;
  cylinderCapacityCcm?: number;
  brakeSystem?: string;
}

/**
 * Get vehicle details by K-type ID
 */
export async function getVehicleById(carId: number): Promise<TecDocVehicle | null> {
  const data = await call<{ data: { array: Array<{ carId: number; vehicleDetails: RawVehicleDetails }> } }>(
    "getVehicleByIds4",
    { country: "cz", lang: "cs", articleCountry: "cz", countriesCarSelection: "cz", carIds: { array: [carId] } }
  );
  const v = data.data?.array?.[0];
  if (!v) return null;
  const d = v.vehicleDetails || {};
  return {
    carId: v.carId,
    carName: d.typeName || String(v.carId),
    yearOfConstFrom: d.yearOfConstrFrom,
    yearOfConstTo: d.yearOfConstrTo,
    powerKwFrom: d.powerKwFrom,
    powerKwTo: d.powerKwTo,
    powerHpFrom: d.powerHpFrom,
    powerHpTo: d.powerHpTo,
    fuelType: d.fuelType,
    engineCodes: d.motorType,
    bodyType: d.constructionType,
    driveType: d.impulsionType,
    cylinders: d.cylinder,
    capacityCcm: d.cylinderCapacityCcm,
  };
}

// ─── Category Tree ────────────────────────────────────────

/**
 * Get category tree for a vehicle (all levels at once)
 */
export async function getCategoriesForVehicle(carId: number): Promise<TecDocCategoryNode[]> {
  const data = await call<{ data: { array: TecDocCategoryNode[] } }>(
    "getChildNodesAllLinkingTarget2",
    {
      country: "cz",
      lang: "cs",
      linkingTargetType: "V",
      linkingTargetId: carId,
      assemblyGroupNodeId: 0,
      childNodes: true,
    }
  );
  return data.data?.array || [];
}

// ─── Articles / Products ──────────────────────────────────

/**
 * Search article by product code (e.g. "GDB1330")
 */
export async function getArticleByCode(code: string): Promise<TecDocArticle | null> {
  const data = await call<{ articles: TecDocArticle[] }>("getArticles", {
    lang: "cs",
    country: "cz",
    articleCountry: "cz",
    searchQuery: code,
    searchType: 0,
    perPage: 1,
    page: 1,
    includeImages: true,
    includeArticleCriteria: true,
    includeOENumbers: true,
    includeComparableNumbers: true,
    includePDFs: true,
    includeGenericArticles: true,
    includeLinks: true,
  });
  return data.articles?.[0] || null;
}

export interface TecDocBrandForVehicle {
  brandNo: number;
  brandName: string;
  genericArticleId: number;
  articleNormName: string;
}

/**
 * Get brands that have parts for a specific vehicle + category
 * This is what we use to find matching products in our inventory
 */
export async function getBrandsForVehicleCategory(
  carId: number,
  assemblyGroupNodeId: number
): Promise<TecDocBrandForVehicle[]> {
  const data = await call<{ data: { array: TecDocBrandForVehicle[] } }>(
    "getGenericArticlesByManufacturer7",
    {
      lang: "cs",
      country: "cz",
      articleCountry: "cz",
      linkingTargetId: carId,
      linkingTargetType: "V",
      assemblyGroupNodeId,
      perPage: 200,
      page: 1,
    }
  );
  return data.data?.array || [];
}

// ─── Images ───────────────────────────────────────────────

/**
 * Get car photo URL by engine K-type ID (via Pegasus documents)
 */
export function getCarPhotoUrl(engineId: number | string): string {
  return `https://webservice.tecalliance.services/pegasus-3-0/documents/${PROVIDER}/DR${engineId}/0?api_key=${API_KEY}`;
}

/**
 * Get car photo via our proxy (hides API key from client)
 */
export function getCarPhotoProxyUrl(engineId: number | string): string {
  return `/api/tecdoc-image?type=car&id=${engineId}`;
}
