"use client";

import { useState, useRef, useCallback } from "react";

interface VinInputProps {
  onSubmit: (vin: string) => void;
  loading?: boolean;
}

function sanitizeVin(v: string): string {
  return (v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[IOQ]/g, "") // I, O, Q not allowed in VIN
    .slice(0, 17);
}

export default function VinInput({ onSubmit, loading }: VinInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chars = sanitizeVin(value).split("");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(sanitizeVin(e.target.value));
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") || "";
    setValue(sanitizeVin(text));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const vin = sanitizeVin(value);
    if (vin.length === 17) onSubmit(vin);
  }, [value, onSubmit]);

  const isComplete = chars.length === 17;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Desktop: 17 cells */}
      <div
        className="hidden sm:flex items-stretch gap-[3px] mb-3 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from({ length: 17 }).map((_, i) => {
          const isFilled = i < chars.length;
          const isCaret = i === chars.length && i < 17;
          return (
            <div
              key={i}
              className={`
                w-[42px] h-[52px] rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all relative
                ${isFilled
                  ? "border-mlgreen/50 bg-mlgreen/[0.04] text-mltext-dark"
                  : "border-mlborder bg-white text-mltext-light"
                }
                ${isCaret ? "border-primary/50" : ""}
              `}
            >
              {isFilled ? chars[i] : ""}
              {isCaret && (
                <span className="absolute inset-y-3 w-[2px] bg-primary/60 animate-pulse rounded-full" />
              )}
              {/* Separator after position 3, 9 */}
              {(i === 2 || i === 8) && (
                <span className="absolute -right-[5px] top-1/2 -translate-y-1/2 text-mlborder text-xs font-bold z-10">–</span>
              )}
            </div>
          );
        })}
        {/* Hidden real input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          inputMode="latin"
          autoComplete="off"
          maxLength={17}
          className="absolute opacity-0 w-0 h-0"
          autoFocus
        />
      </div>

      {/* Mobile: plain input */}
      <div className="sm:hidden mb-3">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          inputMode="latin"
          autoComplete="off"
          maxLength={17}
          placeholder="Zadejte 17místný VIN kód"
          className="w-full bg-white border-2 border-mlborder rounded-xl px-4 py-3 text-lg font-bold text-mltext-dark tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-mltext-light placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
        />
      </div>

      {/* Counter + button */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${isComplete ? "text-mlgreen" : "text-mltext-light"}`}>
          {chars.length}/17
        </span>
        <button
          type="submit"
          disabled={!isComplete || loading}
          className={`flex items-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl transition-all ${
            isComplete && !loading
              ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
              : "bg-gray-100 text-mltext-light cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Hledám...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Vyhledat podle VIN
            </>
          )}
        </button>
      </div>
    </form>
  );
}
