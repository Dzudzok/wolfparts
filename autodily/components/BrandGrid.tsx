"use client";

import { useState } from "react";
import { getCarBrandLogoUrl } from "@/lib/brand-logos";
import VehiclePickerModal from "./VehiclePickerModal";

const BRANDS = [
  { name: "AUDI" }, { name: "BMW" }, { name: "CITROEN", display: "Citroën" },
  { name: "DACIA" }, { name: "FIAT" }, { name: "FORD" }, { name: "HONDA" },
  { name: "HYUNDAI" }, { name: "KIA" }, { name: "MAZDA" },
  { name: "MERCEDES-BENZ", display: "Mercedes" }, { name: "NISSAN" },
  { name: "OPEL" }, { name: "PEUGEOT" }, { name: "RENAULT" }, { name: "SEAT" },
  { name: "SKODA", display: "Škoda" }, { name: "TOYOTA" },
  { name: "VOLVO" }, { name: "VW", display: "Volkswagen" },
];

export default function BrandGrid() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {BRANDS.map((b) => (
          <button
            key={b.name}
            onClick={() => setSelectedBrand(b.name)}
            className="group flex flex-col items-center justify-center bg-white rounded-xl border border-mlborder-light hover:border-primary/30 transition-all p-3 h-[88px] hover:shadow-lg hover:-translate-y-0.5"
          >
            <img
              src={getCarBrandLogoUrl(b.name)}
              alt={b.display || b.name}
              className="h-9 w-auto object-contain mb-1.5 group-hover:scale-110 transition-transform"
              loading="lazy"
            />
            <span className="text-mltext-light text-[9px] font-bold uppercase tracking-wider text-center leading-tight group-hover:text-primary transition-colors">
              {b.display || b.name}
            </span>
          </button>
        ))}
        <button
          onClick={() => setSelectedBrand("")}
          className="group flex flex-col items-center justify-center bg-gradient-to-br from-primary/[0.04] to-accent/[0.06] rounded-xl border border-primary/10 hover:border-primary/30 transition-all p-3 h-[88px] hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors mb-1.5 group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <span className="text-primary text-[9px] font-bold uppercase tracking-wider">Další</span>
        </button>
      </div>

      {selectedBrand !== null && (
        <VehiclePickerModal
          onClose={() => setSelectedBrand(null)}
          initialBrandName={selectedBrand || undefined}
        />
      )}
    </>
  );
}
