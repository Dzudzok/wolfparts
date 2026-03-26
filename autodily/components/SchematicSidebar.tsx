"use client";

import { useState } from "react";
import BrakeSchematic from "./BrakeSchematic";
import FilterSchematic from "./FilterSchematic";

interface Category { nodeId: string; name: string; isEndNode: boolean; }

interface Props {
  showBrake: boolean;
  showFilter: boolean;
  categories: Category[];
  onSelect: (cat: Category & { href: string }) => void;
  engineId: string;
  hoveredCategoryId?: string | null;
  inline?: boolean;
}

export default function SchematicSidebar({ showBrake, showFilter, categories, onSelect, engineId, hoveredCategoryId, inline }: Props) {
  const [hovered, setHovered] = useState(false);

  // Inline mode — render content directly without sticky sidebar wrapper
  if (inline) {
    return (
      <div>
        {showBrake && <BrakeSchematic categories={categories} onSelect={onSelect} engineId={engineId} hoveredCategoryId={hoveredCategoryId} />}
        {showFilter && <FilterSchematic categories={categories} onSelect={onSelect} />}
      </div>
    );
  }

  return (
    <div
      className="hidden xl:block shrink-0 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: "280px" }}
    >
      <div
        className={`border-l border-mlborder-light bg-white overflow-y-auto transition-all duration-400 ease-out ${hovered ? "shadow-2xl shadow-black/15" : ""}`}
        style={{
          position: "sticky",
          top: "64px",
          height: "calc(100vh - 64px)",
          width: hovered ? "700px" : "280px",
          marginLeft: hovered ? "-420px" : "0px",
          zIndex: hovered ? 30 : 1,
          transition: "width 0.4s ease, margin-left 0.4s ease, box-shadow 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-mlborder-light flex items-center gap-2 bg-gray-50/80">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              {showBrake ? <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></> : <path d="M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-9L4.586 7.586A2 2 0 0 1 4 6.172V4z" />}
            </svg>
          </div>
          <span className="text-[11px] font-bold text-mltext-dark">
            {showBrake ? "Schéma brzd" : "Schéma filtrů"}
          </span>
        </div>

        {/* Content */}
        <div className="p-2">
          {showBrake && <BrakeSchematic categories={categories} onSelect={onSelect} engineId={engineId} hoveredCategoryId={hoveredCategoryId} />}
          {showFilter && <FilterSchematic categories={categories} onSelect={onSelect} />}
        </div>
      </div>
    </div>
  );
}
