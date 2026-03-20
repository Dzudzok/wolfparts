"use client";

import { useState } from "react";

interface FacetCount {
  value: string;
  count: number;
}

interface FacetData {
  field_name: string;
  counts: FacetCount[];
}

interface FiltersProps {
  facets: FacetData[];
  activeFilters: {
    brand?: string;
    category?: string;
    assortment?: string;
    in_stock?: boolean;
    is_sale?: boolean;
  };
  onFilterChange: (filters: Record<string, unknown>) => void;
}

function FacetSection({
  title,
  counts,
  activeValue,
  field,
  maxItems,
  searchable,
  onSelect,
}: {
  title: string;
  counts: FacetCount[];
  activeValue?: string;
  field: string;
  maxItems: number;
  searchable?: boolean;
  onSelect: (field: string, value: string | undefined) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = search
    ? counts.filter((c) => c.value.toLowerCase().includes(search.toLowerCase()))
    : counts;
  const displayed = expanded ? filtered : filtered.slice(0, maxItems);

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      {searchable && counts.length > maxItems && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat..."
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      )}
      <div className="space-y-1">
        {displayed.map((c) => (
          <button
            key={c.value}
            onClick={() => onSelect(field, activeValue === c.value ? undefined : c.value)}
            className={`w-full text-left text-sm flex justify-between items-center px-2 py-1 rounded transition-colors ${
              activeValue === c.value
                ? "bg-blue-100 text-blue-800 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="truncate">{c.value}</span>
            <span className="text-xs text-gray-400 ml-2 shrink-0">{c.count}</span>
          </button>
        ))}
      </div>
      {filtered.length > maxItems && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 mt-1"
        >
          {expanded ? "Zobrazit méně" : `Zobrazit vše (${filtered.length})`}
        </button>
      )}
    </div>
  );
}

export default function Filters({ facets, activeFilters, onFilterChange }: FiltersProps) {
  const getFacet = (name: string) => facets.find((f) => f.field_name === name);

  const handleSelect = (field: string, value: string | undefined) => {
    onFilterChange({ ...activeFilters, [field]: value });
  };

  const handleCheckbox = (field: string, checked: boolean) => {
    onFilterChange({ ...activeFilters, [field]: checked || undefined });
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== undefined);

  const brandFacet = getFacet("brand");
  const categoryFacet = getFacet("category");
  const assortmentFacet = getFacet("assortment");

  return (
    <div>
      {brandFacet && brandFacet.counts.length > 0 && (
        <FacetSection
          title="Značka"
          counts={brandFacet.counts}
          activeValue={activeFilters.brand}
          field="brand"
          maxItems={20}
          searchable
          onSelect={handleSelect}
        />
      )}

      {categoryFacet && categoryFacet.counts.length > 0 && (
        <FacetSection
          title="Kategorie"
          counts={categoryFacet.counts}
          activeValue={activeFilters.category}
          field="category"
          maxItems={15}
          onSelect={handleSelect}
        />
      )}

      {assortmentFacet && assortmentFacet.counts.length > 0 && (
        <FacetSection
          title="Sortiment"
          counts={assortmentFacet.counts}
          activeValue={activeFilters.assortment}
          field="assortment"
          maxItems={10}
          onSelect={handleSelect}
        />
      )}

      {/* Checkboxes */}
      <div className="mb-6 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!activeFilters.in_stock}
            onChange={(e) => handleCheckbox("in_stock", e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Pouze skladem
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!activeFilters.is_sale}
            onChange={(e) => handleCheckbox("is_sale", e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Akce / výprodej
        </label>
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => onFilterChange({})}
          className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-2 border border-red-200 rounded hover:bg-red-50 transition-colors"
        >
          Zrušit filtry
        </button>
      )}
    </div>
  );
}
