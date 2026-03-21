import * as fs from "fs";
import * as path from "path";

interface Engine {
  name: string;
  slug: string;
  engineId: number;
  power: string;
  years: string;
  engineCode: string;
}

interface Model {
  name: string;
  slug: string;
  modelId: number;
  years: string;
  engines: Engine[];
}

interface Brand {
  name: string;
  slug: string;
  brandId: number;
  models: Model[];
}

let cached: Brand[] | null = null;

function loadData(): Brand[] {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "data", "tecdoc-vehicles.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  cached = JSON.parse(raw) as Brand[];
  return cached;
}

export function getBrands(): Array<{ name: string; slug: string; brandId: number }> {
  return loadData().map(({ name, slug, brandId }) => ({ name, slug, brandId }));
}

export function getModels(brandId: number): Array<{ name: string; slug: string; modelId: number; years: string }> {
  const brand = loadData().find((b) => b.brandId === brandId);
  if (!brand) return [];
  return brand.models.map(({ name, slug, modelId, years }) => ({ name, slug, modelId, years }));
}

export function getEngines(brandId: number, modelId: number): Engine[] {
  const brand = loadData().find((b) => b.brandId === brandId);
  if (!brand) return [];
  const model = brand.models.find((m) => m.modelId === modelId);
  if (!model) return [];
  return model.engines;
}

export type { Engine, Model, Brand };
