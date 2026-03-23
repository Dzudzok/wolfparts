"use client";

import { useState } from "react";

interface BrakePart {
  id: string;
  label: string;
  x: number;
  y: number;
}

// Positions mapped to a top-down car view (viewBox 380 x 600)
const BRAKE_PARTS: BrakePart[] = [
  { id: "kotoucova-brzda", label: "Kotoučová brzda", x: 60, y: 135 },
  { id: "brzdovy-trmen", label: "Brzdový třmen", x: 100, y: 105 },
  { id: "bubnova-brzda", label: "Bubnová brzda", x: 60, y: 445 },
  { id: "parkovaci-brzda", label: "Parkovací brzda", x: 190, y: 500 },
  { id: "brzdovy-valecek", label: "Brzdový váleček", x: 100, y: 475 },
  { id: "brzdove-hadicky", label: "Brzdové hadičky", x: 130, y: 195 },
  { id: "brzdove-potrubi", label: "Brzdové potrubí", x: 190, y: 270 },
  { id: "posilovac-brzd", label: "Posilovač brzd", x: 190, y: 215 },
  { id: "hlavni-brzdovy-valec", label: "Hlavní brzd. válec", x: 190, y: 255 },
  { id: "brzdova-kapalina", label: "Brzdová kapalina", x: 230, y: 235 },
  { id: "regulator-brzdne-sily", label: "Regulátor brzd. síly", x: 190, y: 370 },
  { id: "spinac-brzdoveho-svetla", label: "Spínač brzd. světla", x: 240, y: 195 },
];

interface Props {
  categories: { nodeId: string; name: string; isEndNode: boolean }[];
  onSelect: (cat: { nodeId: string; name: string; isEndNode: boolean; href: string }) => void;
}

function matchCategory(part: BrakePart, categories: Props["categories"]) {
  const l = part.label.toLowerCase();
  return categories.find((c) => {
    const cn = c.name.toLowerCase();
    if (cn === l) return true;
    const pw = l.split(" ").slice(0, 2).join(" ");
    if (cn.startsWith(pw)) return true;
    if (l.startsWith(cn.split(" ").slice(0, 2).join(" "))) return true;
    return false;
  });
}

export default function BrakeSchematic({ categories, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  function Hotspot({ part }: { part: BrakePart }) {
    const cat = matchCategory(part, categories);
    if (!cat) return null;
    const isHov = hovered === part.id;

    return (
      <g
        className="cursor-pointer"
        onMouseEnter={() => setHovered(part.id)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onSelect({ ...cat, href: "" })}
      >
        <circle cx={part.x} cy={part.y} r="16" fill="transparent" />
        {!isHov && (
          <circle cx={part.x} cy={part.y} r="5" fill="none" stroke="#E8192C" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" from="5" to="12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={part.x} cy={part.y} r={isHov ? 6 : 4} fill={isHov ? "#E8192C" : "white"} stroke="#E8192C" strokeWidth="2" className="transition-all duration-150" />
      </g>
    );
  }

  const hl = (id: string, base: string, active: string) => hovered === id ? active : base;

  return (
    <div className="flex flex-col h-full">
      {/* SVG — top-down car with brake system */}
      <svg viewBox="0 0 380 580" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bgrid" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#f3f4f6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="380" height="580" fill="url(#bgrid)" rx="12" />

        {/* ═══ CAR BODY — top-down silhouette ═══ */}
        <path
          d="M 140 60 Q 140 40 190 35 Q 240 40 240 60
             L 250 100 Q 260 130 260 170
             L 260 410 Q 260 450 250 480
             L 240 520 Q 240 540 190 545 Q 140 540 140 520
             L 130 480 Q 120 450 120 410
             L 120 170 Q 120 130 130 100 Z"
          fill="#f8fafc" stroke="#d1d5db" strokeWidth="1.5"
        />
        {/* Windshield */}
        <path d="M 148 95 Q 190 80 232 95 L 228 130 Q 190 120 152 130 Z" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1" opacity="0.6" />
        {/* Rear window */}
        <path d="M 152 450 Q 190 460 228 450 L 232 485 Q 190 495 148 485 Z" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1" opacity="0.6" />

        {/* ═══ FRONT LEFT WHEEL — disc brake ═══ */}
        <g>
          {/* Tire */}
          <rect x="75" y="110" width="45" height="70" rx="8" fill={hl("kotoucova-brzda", "#e5e7eb", "#fecaca")} stroke={hl("kotoucova-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "kotoucova-brzda" ? 2.5 : 1.5} className="transition-all duration-150" />
          {/* Disc */}
          <circle cx="97" cy="145" r="20" fill="none" stroke={hl("kotoucova-brzda", "#9ca3af", "#E8192C")} strokeWidth="1.5" />
          <circle cx="97" cy="145" r="14" fill="none" stroke={hl("kotoucova-brzda", "#d1d5db", "#fca5a5")} strokeWidth="0.8" strokeDasharray="3 2" />
          <circle cx="97" cy="145" r="5" fill={hl("kotoucova-brzda", "#d1d5db", "#fca5a5")} />
          {/* Caliper */}
          <rect x="85" y="107" width="24" height="14" rx="3" fill={hl("brzdovy-trmen", "#f3f4f6", "#fef2f2")} stroke={hl("brzdovy-trmen", "#9ca3af", "#E8192C")} strokeWidth={hovered === "brzdovy-trmen" ? 2 : 1.5} className="transition-all duration-150" />
          <rect x="90" y="110" width="14" height="3" rx="1" fill={hl("brzdovy-trmen", "#d1d5db", "#fca5a5")} />
          <rect x="90" y="115" width="14" height="3" rx="1" fill={hl("brzdovy-trmen", "#d1d5db", "#fca5a5")} />
        </g>

        {/* FRONT RIGHT WHEEL — mirror */}
        <g>
          <rect x="260" y="110" width="45" height="70" rx="8" fill={hl("kotoucova-brzda", "#e5e7eb", "#fecaca")} stroke={hl("kotoucova-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "kotoucova-brzda" ? 2.5 : 1.5} className="transition-all duration-150" />
          <circle cx="283" cy="145" r="20" fill="none" stroke={hl("kotoucova-brzda", "#9ca3af", "#E8192C")} strokeWidth="1.5" />
          <circle cx="283" cy="145" r="14" fill="none" stroke={hl("kotoucova-brzda", "#d1d5db", "#fca5a5")} strokeWidth="0.8" strokeDasharray="3 2" />
          <circle cx="283" cy="145" r="5" fill={hl("kotoucova-brzda", "#d1d5db", "#fca5a5")} />
          <rect x="271" y="107" width="24" height="14" rx="3" fill={hl("brzdovy-trmen", "#f3f4f6", "#fef2f2")} stroke={hl("brzdovy-trmen", "#9ca3af", "#E8192C")} strokeWidth={hovered === "brzdovy-trmen" ? 2 : 1.5} className="transition-all duration-150" />
        </g>

        {/* ═══ REAR LEFT WHEEL — drum brake ═══ */}
        <g>
          <rect x="75" y="415" width="45" height="70" rx="8" fill={hl("bubnova-brzda", "#e5e7eb", "#fecaca")} stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "bubnova-brzda" ? 2.5 : 1.5} className="transition-all duration-150" />
          <circle cx="97" cy="450" r="20" fill={hl("bubnova-brzda", "#f3f4f6", "#fef2f2")} stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth="1.5" />
          <circle cx="97" cy="450" r="5" fill={hl("bubnova-brzda", "#d1d5db", "#fca5a5")} />
          {/* Shoes */}
          <path d="M 86 438 Q 82 450 86 462" fill="none" stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth="2" />
          <path d="M 108 438 Q 112 450 108 462" fill="none" stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth="2" />
          {/* Wheel cylinder */}
          <rect x="87" y="434" width="20" height="8" rx="2" fill={hl("brzdovy-valecek", "white", "#fef2f2")} stroke={hl("brzdovy-valecek", "#9ca3af", "#E8192C")} strokeWidth={hovered === "brzdovy-valecek" ? 2 : 1} />
        </g>

        {/* REAR RIGHT WHEEL — mirror */}
        <g>
          <rect x="260" y="415" width="45" height="70" rx="8" fill={hl("bubnova-brzda", "#e5e7eb", "#fecaca")} stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "bubnova-brzda" ? 2.5 : 1.5} className="transition-all duration-150" />
          <circle cx="283" cy="450" r="20" fill={hl("bubnova-brzda", "#f3f4f6", "#fef2f2")} stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth="1.5" />
          <circle cx="283" cy="450" r="5" fill={hl("bubnova-brzda", "#d1d5db", "#fca5a5")} />
          <path d="M 272 438 Q 268 450 272 462" fill="none" stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth="2" />
          <path d="M 294 438 Q 298 450 294 462" fill="none" stroke={hl("bubnova-brzda", "#9ca3af", "#E8192C")} strokeWidth="2" />
        </g>

        {/* ═══ BRAKE LINES ═══ */}
        {/* Front left hose (flexible) */}
        <path d="M 120 145 Q 130 145 135 160 Q 140 175 145 180 L 170 210"
          fill="none" stroke={hl("brzdove-hadicky", "#f59e0b", "#E8192C")} strokeWidth={hovered === "brzdove-hadicky" ? 2.5 : 1.5} strokeDasharray={hovered === "brzdove-hadicky" ? "none" : "4 2"} className="transition-all duration-150" />
        {/* Front right hose */}
        <path d="M 260 145 Q 250 145 245 160 Q 240 175 235 180 L 210 210"
          fill="none" stroke={hl("brzdove-hadicky", "#f59e0b", "#E8192C")} strokeWidth={hovered === "brzdove-hadicky" ? 2.5 : 1.5} strokeDasharray={hovered === "brzdove-hadicky" ? "none" : "4 2"} className="transition-all duration-150" />

        {/* Rigid pipes — front to master cylinder */}
        <path d="M 170 210 L 180 230 L 190 250"
          fill="none" stroke={hl("brzdove-potrubi", "#6b7280", "#E8192C")} strokeWidth={hovered === "brzdove-potrubi" ? 2.5 : 1.5} className="transition-all duration-150" />
        <path d="M 210 210 L 200 230 L 190 250"
          fill="none" stroke={hl("brzdove-potrubi", "#6b7280", "#E8192C")} strokeWidth={hovered === "brzdove-potrubi" ? 2.5 : 1.5} className="transition-all duration-150" />
        {/* Pipes to rear */}
        <path d="M 190 270 L 190 370 L 170 400 L 120 440"
          fill="none" stroke={hl("brzdove-potrubi", "#6b7280", "#E8192C")} strokeWidth={hovered === "brzdove-potrubi" ? 2.5 : 1.5} className="transition-all duration-150" />
        <path d="M 190 370 L 210 400 L 260 440"
          fill="none" stroke={hl("brzdove-potrubi", "#6b7280", "#E8192C")} strokeWidth={hovered === "brzdove-potrubi" ? 2.5 : 1.5} className="transition-all duration-150" />

        {/* ═══ MASTER CYLINDER + BOOSTER ═══ */}
        {/* Brake booster (vacuum) */}
        <circle cx="190" cy="215" r="18" fill={hl("posilovac-brzd", "#f3f4f6", "#fef2f2")} stroke={hl("posilovac-brzd", "#374151", "#E8192C")} strokeWidth={hovered === "posilovac-brzd" ? 2.5 : 1.5} className="transition-all duration-150" />
        <circle cx="190" cy="215" r="10" fill="none" stroke={hl("posilovac-brzd", "#d1d5db", "#fca5a5")} strokeWidth="0.8" />
        <text x="190" y="219" textAnchor="middle" className="text-[8px] font-bold" fill={hl("posilovac-brzd", "#9ca3af", "#E8192C")}>VAC</text>

        {/* Master cylinder */}
        <rect x="170" y="240" width="40" height="20" rx="5" fill={hl("hlavni-brzdovy-valec", "#f3f4f6", "#fef2f2")} stroke={hl("hlavni-brzdovy-valec", "#374151", "#E8192C")} strokeWidth={hovered === "hlavni-brzdovy-valec" ? 2.5 : 2} className="transition-all duration-150" />
        <rect x="176" y="245" width="12" height="10" rx="2" fill={hl("hlavni-brzdovy-valec", "#d1d5db", "#fca5a5")} />
        <rect x="192" y="245" width="12" height="10" rx="2" fill={hl("hlavni-brzdovy-valec", "#e5e7eb", "#fecaca")} />

        {/* Fluid reservoir */}
        <rect x="218" y="228" width="20" height="16" rx="3" fill={hl("brzdova-kapalina", "#fefce8", "#fef2f2")} stroke={hl("brzdova-kapalina", "#d1d5db", "#E8192C")} strokeWidth={hovered === "brzdova-kapalina" ? 2 : 1.5} className="transition-all duration-150" />
        <rect x="221" y="231" width="14" height="6" rx="1.5" fill={hl("brzdova-kapalina", "#fde68a", "#fca5a5")} opacity="0.5" />
        <line x1="210" y1="240" x2="218" y2="237" stroke={hl("brzdova-kapalina", "#9ca3af", "#E8192C")} strokeWidth="1.5" />

        {/* Brake light switch */}
        <circle cx="240" cy="195" r="7" fill={hl("spinac-brzdoveho-svetla", "#f9fafb", "#fef2f2")} stroke={hl("spinac-brzdoveho-svetla", "#d1d5db", "#E8192C")} strokeWidth={hovered === "spinac-brzdoveho-svetla" ? 2 : 1} />
        <circle cx="240" cy="195" r="3" fill={hl("spinac-brzdoveho-svetla", "#fbbf24", "#E8192C")} />
        <line x1="233" y1="200" x2="208" y2="215" stroke={hl("spinac-brzdoveho-svetla", "#d1d5db", "#E8192C")} strokeWidth="1" />

        {/* Brake force regulator */}
        <rect x="175" y="360" width="30" height="18" rx="4" fill={hl("regulator-brzdne-sily", "#f3f4f6", "#fef2f2")} stroke={hl("regulator-brzdne-sily", "#9ca3af", "#E8192C")} strokeWidth={hovered === "regulator-brzdne-sily" ? 2 : 1.5} className="transition-all duration-150" />
        <path d="M 182 367 L 186 373 L 192 367 L 196 373" fill="none" stroke={hl("regulator-brzdne-sily", "#9ca3af", "#E8192C")} strokeWidth="1.5" />

        {/* Parking brake cable */}
        <path d="M 190 500 L 190 480 L 140 465" fill="none" stroke={hl("parkovaci-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "parkovaci-brzda" ? 2.5 : 1.5} strokeDasharray="5 3" />
        <path d="M 190 480 L 240 465" fill="none" stroke={hl("parkovaci-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "parkovaci-brzda" ? 2.5 : 1.5} strokeDasharray="5 3" />
        <rect x="178" y="494" width="24" height="14" rx="4" fill={hl("parkovaci-brzda", "#f3f4f6", "#fef2f2")} stroke={hl("parkovaci-brzda", "#9ca3af", "#E8192C")} strokeWidth={hovered === "parkovaci-brzda" ? 2 : 1.5} />
        <text x="190" y="505" textAnchor="middle" className="text-[8px] font-bold" fill={hl("parkovaci-brzda", "#9ca3af", "#E8192C")}>P</text>

        {/* ═══ LABELS ═══ */}
        <text x="97" y="100" textAnchor="middle" className="text-[8px] font-bold uppercase tracking-wider" fill="#9ca3af">Přední</text>
        <text x="97" y="408" textAnchor="middle" className="text-[8px] font-bold uppercase tracking-wider" fill="#9ca3af">Zadní</text>

        {/* ═══ HOTSPOTS ═══ */}
        {BRAKE_PARTS.map((part) => <Hotspot key={part.id} part={part} />)}
      </svg>

      {/* Part list below */}
      <div className="mt-3 flex flex-col gap-0.5">
        {BRAKE_PARTS.map((part) => {
          const cat = matchCategory(part, categories);
          if (!cat) return null;
          const isHov = hovered === part.id;
          return (
            <button
              key={part.id}
              onMouseEnter={() => setHovered(part.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect({ ...cat, href: "" })}
              className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-2 ${
                isHov ? "bg-primary/10 text-primary" : "text-mltext hover:bg-gray-50"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isHov ? "bg-primary" : "bg-mlborder"}`} />
              {part.label}
              <svg viewBox="0 0 24 24" className={`w-3 h-3 ml-auto shrink-0 transition-colors ${isHov ? "text-primary" : "text-transparent"}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
