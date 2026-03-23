"use client";

import { useState } from "react";

interface FilterPart {
  id: string;
  label: string;
  x: number;
  y: number;
}

const FILTER_PARTS: FilterPart[] = [
  { id: "olejovy-filtr", label: "Olejový filtr", x: 70, y: 330 },
  { id: "vzduchovy-filtr", label: "Vzduchový filtr", x: 230, y: 75 },
  { id: "palivovy-filtr", label: "Palivový filtr", x: 55, y: 165 },
  { id: "kabinovy-filtr", label: "Kabinový filtr", x: 230, y: 470 },
  { id: "filtr-chladiva", label: "Filtr chladiva", x: 230, y: 190 },
  { id: "hydraulicky-filtr", label: "Hydraulický filtr", x: 55, y: 440 },
  { id: "filtr-mocoviny", label: "Filtr močoviny", x: 150, y: 560 },
];

interface Props {
  categories: { nodeId: string; name: string; isEndNode: boolean }[];
  onSelect: (cat: { nodeId: string; name: string; isEndNode: boolean; href: string }) => void;
}

function matchCategory(part: FilterPart, categories: Props["categories"]) {
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

export default function FilterSchematic({ categories, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  function Hotspot({ part }: { part: FilterPart }) {
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
        <circle cx={part.x} cy={part.y} r="18" fill="transparent" />
        {!isHov && (
          <circle cx={part.x} cy={part.y} r="5" fill="none" stroke="#6366F1" strokeWidth="1.2" opacity="0.4">
            <animate attributeName="r" from="5" to="13" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={part.x} cy={part.y} r={isHov ? 6 : 4} fill={isHov ? "#6366F1" : "white"} stroke="#6366F1" strokeWidth="2" className="transition-all duration-150" />
      </g>
    );
  }

  const h = (id: string, base: string, on: string) => hovered === id ? on : base;
  const hw = (id: string, base: number, on: number) => hovered === id ? on : base;
  const AC = "#6366F1"; // accent color

  return (
    <div className="flex flex-col h-full">
      <svg viewBox="0 0 290 620" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fgrid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#f3f4f6" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="290" height="620" fill="url(#fgrid)" rx="10" />

        {/* ═══ RADIATOR — top ═══ */}
        <rect x="60" y="18" width="170" height="28" rx="4" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
          <line key={`rad-${i}`} x1={72 + i * 14} y1="22" x2={72 + i * 14} y2="42" stroke="#bae6fd" strokeWidth="0.8" />
        ))}
        <text x="145" y="34" textAnchor="middle" className="text-[7px] font-bold uppercase" fill="#7dd3fc">Chladič</text>

        {/* ═══ AIR FILTER BOX — top right ═══ */}
        <rect x="195" y="55" width="80" height="50" rx="8"
          fill={h("vzduchovy-filtr", "#f8fafc", "#eef2ff")}
          stroke={h("vzduchovy-filtr", "#94a3b8", AC)}
          strokeWidth={hw("vzduchovy-filtr", 1.5, 2.5)}
          className="transition-all duration-150" />
        {/* Filter pleats */}
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`af-${i}`} x1={205 + i * 9} y1="63" x2={205 + i * 9} y2="97" stroke={h("vzduchovy-filtr", "#cbd5e1", "#a5b4fc")} strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* Intake pipe → engine */}
        <path d="M 195 80 L 175 80 Q 165 80 165 90 L 165 140"
          fill="none" stroke={h("vzduchovy-filtr", "#64748b", AC)} strokeWidth="3" strokeLinecap="round" />
        <text x="235" y="115" textAnchor="middle" className="text-[8px] font-bold" fill={h("vzduchovy-filtr", "#94a3b8", AC)}>Vzduch</text>
        {/* Arrow into airbox */}
        <path d="M 280 72 L 275 80 L 280 88" fill="none" stroke={h("vzduchovy-filtr", "#94a3b8", AC)} strokeWidth="1.5" />
        <line x1="285" y1="80" x2="275" y2="80" stroke={h("vzduchovy-filtr", "#94a3b8", AC)} strokeWidth="1.5" />

        {/* ═══ ENGINE BLOCK ═══ */}
        <rect x="90" y="140" width="110" height="170" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Valve cover */}
        <rect x="100" y="148" width="90" height="30" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        {/* Spark plugs */}
        {[0,1,2,3].map(i => (
          <g key={`sp-${i}`}>
            <rect x={110 + i * 20} y="150" width="6" height="14" rx="1.5" fill="#e2e8f0" />
            <circle cx={113 + i * 20} cy="154" r="1.5" fill="#94a3b8" />
          </g>
        ))}
        {/* Block pattern — cylinders side view */}
        {[0,1,2,3].map(i => (
          <g key={`cyl-${i}`}>
            <rect x="108" y={188 + i * 26} width="74" height="20" rx="3" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            <circle cx="145" cy={198 + i * 26} r="6" fill="none" stroke="#e2e8f0" strokeWidth="0.7" />
          </g>
        ))}
        <text x="145" y="300" textAnchor="middle" className="text-[9px] font-bold uppercase tracking-wider" fill="#94a3b8">Motor</text>

        {/* ═══ FUEL FILTER — left of engine ═══ */}
        {/* Cylindrical shape */}
        <rect x="25" y="145" width="50" height="40" rx="6"
          fill={h("palivovy-filtr", "#f8fafc", "#eef2ff")}
          stroke={h("palivovy-filtr", "#94a3b8", AC)}
          strokeWidth={hw("palivovy-filtr", 1.5, 2.5)}
          className="transition-all duration-150" />
        {/* IN port */}
        <circle cx="35" cy="155" r="4" fill={h("palivovy-filtr", "#fef3c7", "#c7d2fe")} stroke={h("palivovy-filtr", "#f59e0b", AC)} strokeWidth="1.5" />
        <text x="35" y="157" textAnchor="middle" className="text-[5px] font-bold" fill={h("palivovy-filtr", "#92400e", AC)}>IN</text>
        {/* OUT port */}
        <circle cx="65" cy="155" r="4" fill={h("palivovy-filtr", "#fef3c7", "#c7d2fe")} stroke={h("palivovy-filtr", "#f59e0b", AC)} strokeWidth="1.5" />
        <text x="65" y="157" textAnchor="middle" className="text-[5px] font-bold" fill={h("palivovy-filtr", "#92400e", AC)}>OUT</text>
        {/* Fuel line to engine */}
        <line x1="75" y1="165" x2="90" y2="180" stroke={h("palivovy-filtr", "#f59e0b", AC)} strokeWidth="2" strokeDasharray="4 2" />
        <text x="50" y="196" textAnchor="middle" className="text-[7px] font-bold" fill={h("palivovy-filtr", "#94a3b8", AC)}>Palivo</text>
        {/* From fuel tank */}
        <line x1="25" y1="165" x2="10" y2="165" stroke={h("palivovy-filtr", "#d97706", AC)} strokeWidth="1.5" />
        <text x="8" y="160" textAnchor="end" className="text-[6px]" fill="#94a3b8">← nádrž</text>

        {/* ═══ COOLANT FILTER — right of engine ═══ */}
        <rect x="210" y="170" width="55" height="35" rx="6"
          fill={h("filtr-chladiva", "#f0f9ff", "#eef2ff")}
          stroke={h("filtr-chladiva", "#94a3b8", AC)}
          strokeWidth={hw("filtr-chladiva", 1.5, 2.5)}
          className="transition-all duration-150" />
        <circle cx="225" cy="187" r="7" fill="none" stroke={h("filtr-chladiva", "#38bdf8", AC)} strokeWidth="1.5" />
        <circle cx="250" cy="187" r="7" fill="none" stroke={h("filtr-chladiva", "#38bdf8", AC)} strokeWidth="1.5" />
        <text x="237" y="215" textAnchor="middle" className="text-[7px] font-bold" fill={h("filtr-chladiva", "#94a3b8", AC)}>Chladivo</text>
        {/* Lines */}
        <line x1="210" y1="187" x2="200" y2="200" stroke={h("filtr-chladiva", "#38bdf8", AC)} strokeWidth="1.5" />
        <line x1="237" y1="170" x2="237" y2="46" stroke={h("filtr-chladiva", "#38bdf8", AC)} strokeWidth="1.5" strokeDasharray="3 2" />

        {/* ═══ OIL FILTER — bottom of engine ═══ */}
        {/* Cylinder shape */}
        <ellipse cx="70" cy="330" rx="28" ry="22"
          fill={h("olejovy-filtr", "#f8fafc", "#eef2ff")}
          stroke={h("olejovy-filtr", "#94a3b8", AC)}
          strokeWidth={hw("olejovy-filtr", 1.5, 2.5)}
          className="transition-all duration-150" />
        <ellipse cx="70" cy="330" rx="16" ry="12" fill="none" stroke={h("olejovy-filtr", "#cbd5e1", "#a5b4fc")} strokeWidth="0.8" />
        <ellipse cx="70" cy="330" rx="5" ry="4" fill={h("olejovy-filtr", "#cbd5e1", "#a5b4fc")} />
        {/* Thread pattern on top */}
        <path d="M 52 318 Q 70 312 88 318" fill="none" stroke={h("olejovy-filtr", "#94a3b8", AC)} strokeWidth="1" />
        {/* Oil line to engine */}
        <path d="M 90 320 L 110 310 L 120 310"
          fill="none" stroke={h("olejovy-filtr", "#854d0e", AC)} strokeWidth="2" />
        <text x="70" y="365" textAnchor="middle" className="text-[7px] font-bold" fill={h("olejovy-filtr", "#94a3b8", AC)}>Olej</text>
        {/* Oil pan */}
        <rect x="95" y="310" width="100" height="20" rx="4" fill="#fefce8" stroke="#fde68a" strokeWidth="0.8" opacity="0.5" />
        <text x="145" y="323" textAnchor="middle" className="text-[6px] font-bold" fill="#d4a20a">OIL PAN</text>

        {/* ═══ FIREWALL ═══ */}
        <line x1="15" y1="400" x2="275" y2="400" stroke="#94a3b8" strokeWidth="1" strokeDasharray="8 4" />
        <text x="275" y="396" textAnchor="end" className="text-[7px] font-bold uppercase tracking-wider" fill="#94a3b8">Přepážka</text>

        {/* ═══ CABIN FILTER — behind firewall ═══ */}
        <rect x="195" y="435" width="75" height="45" rx="8"
          fill={h("kabinovy-filtr", "#f8fafc", "#eef2ff")}
          stroke={h("kabinovy-filtr", "#94a3b8", AC)}
          strokeWidth={hw("kabinovy-filtr", 1.5, 2.5)}
          className="transition-all duration-150" />
        {/* Pleats */}
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`cf-${i}`} x1={203 + i * 9} y1="442" x2={203 + i * 9} y2="473" stroke={h("kabinovy-filtr", "#d1d5db", "#a5b4fc")} strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* Duct from HVAC */}
        <path d="M 232 435 L 232 415 Q 232 408 225 408 L 200 408"
          fill="none" stroke={h("kabinovy-filtr", "#64748b", AC)} strokeWidth="2" />
        {/* Fan icon */}
        <circle cx="232" cy="500" r="10" fill="none" stroke={h("kabinovy-filtr", "#94a3b8", AC)} strokeWidth="1" />
        <path d="M 228 496 Q 232 500 228 504 M 236 496 Q 232 500 236 504" fill="none" stroke={h("kabinovy-filtr", "#94a3b8", AC)} strokeWidth="1" />
        <text x="232" y="520" textAnchor="middle" className="text-[7px] font-bold" fill={h("kabinovy-filtr", "#94a3b8", AC)}>Kabina</text>

        {/* ═══ HYDRAULIC FILTER — bottom left ═══ */}
        <rect x="20" y="420" width="55" height="38" rx="6"
          fill={h("hydraulicky-filtr", "#f8fafc", "#eef2ff")}
          stroke={h("hydraulicky-filtr", "#94a3b8", AC)}
          strokeWidth={hw("hydraulicky-filtr", 1.5, 2.5)}
          className="transition-all duration-150" />
        {/* Ports */}
        <circle cx="35" cy="433" r="4" fill="none" stroke={h("hydraulicky-filtr", "#94a3b8", AC)} strokeWidth="1.5" />
        <circle cx="60" cy="433" r="4" fill="none" stroke={h("hydraulicky-filtr", "#94a3b8", AC)} strokeWidth="1.5" />
        {/* Line up to power steering */}
        <line x1="47" y1="420" x2="47" y2="360" stroke={h("hydraulicky-filtr", "#94a3b8", AC)} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="47" y="470" textAnchor="middle" className="text-[7px] font-bold" fill={h("hydraulicky-filtr", "#94a3b8", AC)}>Hydraulika</text>

        {/* ═══ UREA / AdBlue FILTER — bottom center ═══ */}
        <rect x="110" y="540" width="75" height="40" rx="8"
          fill={h("filtr-mocoviny", "#f0f9ff", "#eef2ff")}
          stroke={h("filtr-mocoviny", "#94a3b8", AC)}
          strokeWidth={hw("filtr-mocoviny", 1.5, 2.5)}
          className="transition-all duration-150" />
        <text x="147" y="557" textAnchor="middle" className="text-[8px] font-bold" fill={h("filtr-mocoviny", "#0284c7", AC)}>AdBlue</text>
        <circle cx="147" cy="570" r="5" fill="none" stroke={h("filtr-mocoviny", "#0284c7", AC)} strokeWidth="1.5" />
        {/* Pipe to exhaust */}
        <path d="M 185 560 L 220 560 L 250 540"
          fill="none" stroke={h("filtr-mocoviny", "#64748b", AC)} strokeWidth="1.5" strokeDasharray="4 2" />
        <text x="258" y="537" className="text-[6px]" fill="#94a3b8">→ SCR</text>
        {/* Pipe from tank */}
        <line x1="110" y1="560" x2="80" y2="560" stroke={h("filtr-mocoviny", "#0284c7", AC)} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="75" y="557" textAnchor="end" className="text-[6px]" fill="#94a3b8">nádrž ←</text>

        {/* ═══ HOTSPOTS ═══ */}
        {FILTER_PARTS.map((part) => <Hotspot key={part.id} part={part} />)}
      </svg>

      {/* Part list */}
      <div className="mt-3 flex flex-col gap-0.5">
        {FILTER_PARTS.map((part) => {
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
                isHov ? "bg-indigo-50 text-indigo-600" : "text-mltext hover:bg-gray-50"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isHov ? "bg-indigo-500" : "bg-mlborder"}`} />
              {part.label}
              <svg viewBox="0 0 24 24" className={`w-3 h-3 ml-auto shrink-0 transition-colors ${isHov ? "text-indigo-500" : "text-transparent"}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
