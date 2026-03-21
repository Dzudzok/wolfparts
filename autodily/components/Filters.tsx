"use client";

import { useState } from "react";

interface FacetCount { value: string; count: number; }
interface FacetData { field_name: string; counts: FacetCount[]; }
interface FiltersProps {
  facets: FacetData[];
  activeFilters: Record<string, string | boolean | undefined>;
  onFilterChange: (filters: Record<string, string | boolean | undefined>) => void;
}

function FacetSection({ title, counts, activeValue, field, maxItems, searchable, onSelect }: {
  title: string; counts: FacetCount[]; activeValue?: string; field: string;
  maxItems: number; searchable?: boolean; onSelect: (field: string, value: string | undefined) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);

  const filtered = search ? counts.filter((c) => c.value.toLowerCase().includes(search.toLowerCase())) : counts;
  const displayed = expanded ? filtered : filtered.slice(0, maxItems);

  return (
    <div className="mb-5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-2 group">
        <h3 className="font-bold text-mltext-dark text-[13px] uppercase tracking-wider">{title}</h3>
        <svg viewBox="0 0 24 24" className={`w-4 h-4 text-mltext-light transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <>
          {searchable && counts.length > maxItems && (
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hledat..."
              className="w-full text-sm bg-gray-50 border border-mlborder rounded-lg px-3 py-2 mb-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          )}
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {displayed.map((c) => (
              <button
                key={c.value}
                onClick={() => onSelect(field, activeValue === c.value ? undefined : c.value)}
                className={`w-full text-left text-[13px] flex justify-between items-center px-2.5 py-1.5 rounded-lg transition-all ${
                  activeValue === c.value
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-mltext hover:bg-gray-50"
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${
                    activeValue === c.value ? "border-primary bg-primary" : "border-mlborder"
                  }`}>
                    {activeValue === c.value && (
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {c.value}
                </span>
                <span className="text-[11px] text-mltext-light ml-2 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">{c.count}</span>
              </button>
            ))}
          </div>
          {filtered.length > maxItems && (
            <button onClick={() => setExpanded(!expanded)} className="text-[13px] text-primary hover:text-primary-dark font-semibold mt-2">
              {expanded ? "Méně" : `+${filtered.length - maxItems} dalších`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function Filters({ facets, activeFilters, onFilterChange }: FiltersProps) {
  const getFacet = (name: string) => facets.find((f) => f.field_name === name);
  const handleSelect = (field: string, value: string | undefined) => onFilterChange({ ...activeFilters, [field]: value });
  const handleCheckbox = (field: string, checked: boolean) => onFilterChange({ ...activeFilters, [field]: checked || undefined });
  const hasActive = Object.values(activeFilters).some((v) => v !== undefined);

  const brandFacet = getFacet("brand");
  const categoryFacet = getFacet("category");
  const assortmentFacet = getFacet("assortment");

  return (
    <div>
      {brandFacet && brandFacet.counts.length > 0 && (
        <FacetSection title="Značka" counts={brandFacet.counts} activeValue={activeFilters.brand as string | undefined} field="brand" maxItems={15} searchable onSelect={handleSelect} />
      )}
      {categoryFacet && categoryFacet.counts.length > 0 && (
        <FacetSection title="Kategorie" counts={categoryFacet.counts} activeValue={activeFilters.category as string | undefined} field="category" maxItems={10} onSelect={handleSelect} />
      )}
      {assortmentFacet && assortmentFacet.counts.length > 0 && (
        <FacetSection title="Sortiment" counts={assortmentFacet.counts} activeValue={activeFilters.assortment as string | undefined} field="assortment" maxItems={8} onSelect={handleSelect} />
      )}

      <div className="mb-5 space-y-2">
        {[
          { field: "in_stock", label: "Pouze skladem", checked: !!activeFilters.in_stock },
          { field: "is_sale", label: "Akce / výprodej", checked: !!activeFilters.is_sale },
        ].map((item) => (
          <label key={item.field} className="flex items-center gap-2.5 cursor-pointer text-[13px] text-mltext hover:text-mltext-dark transition-colors py-1">
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${item.checked ? "border-primary bg-primary" : "border-mlborder"}`}>
              {item.checked && (
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </span>
            {item.label}
          </label>
        ))}
      </div>

      {hasActive && (
        <button onClick={() => onFilterChange({})} className="w-full text-[13px] text-primary hover:text-white hover:bg-primary font-bold py-2.5 border-2 border-primary/20 hover:border-primary rounded-xl transition-all">
          Zrušit filtry
        </button>
      )}
    </div>
  );
}
