"use client";

import { useState } from "react";
import VehiclePickerModal from "./VehiclePickerModal";

export default function VehiclePickerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-primary/30 rounded-2xl px-6 py-5 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 group-hover:scale-105 transition-all">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <span className="block text-white font-bold text-[15px]">Vyberte vaše vozidlo</span>
          <span className="block text-white/30 text-sm mt-0.5">Značka → Model → Motorizace</span>
        </div>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {open && <VehiclePickerModal onClose={() => setOpen(false)} />}
    </>
  );
}
