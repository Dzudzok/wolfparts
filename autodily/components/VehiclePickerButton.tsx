"use client";

import { useState } from "react";
import VehiclePickerModal from "./VehiclePickerModal";

export default function VehiclePickerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between bg-gray-50 hover:bg-primary/[0.04] border-2 border-dashed border-gray-200 hover:border-primary/30 rounded-xl h-14 px-5 transition-all group"
      >
        <span className="text-mltext-light text-sm group-hover:text-mltext-dark transition-colors">Vyberte značku, model a motor...</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vybrat</span>
          <div className="w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </button>

      {open && <VehiclePickerModal onClose={() => setOpen(false)} />}
    </>
  );
}
