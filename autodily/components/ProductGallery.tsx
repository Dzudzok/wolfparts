"use client";

import { useState, useEffect } from "react";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";

interface ProductGalleryProps {
  imageUrl?: string;
  productId: string;
  brand: string;
  alt: string;
}

export default function ProductGallery({ imageUrl, productId, brand, alt }: ProductGalleryProps) {
  const [images, setImages] = useState<string[]>(imageUrl ? [imageUrl] : []);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(!imageUrl);

  useEffect(() => {
    fetch(`/api/product-image?id=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length) {
          setImages(data.images);
          setActive(0);
        } else if (data.imageUrl) {
          setImages([data.imageUrl]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="aspect-square bg-white rounded-2xl border border-mlborder-light flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 border-t-primary/40 animate-spin" />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="aspect-square bg-white rounded-2xl border border-mlborder-light flex items-center justify-center">
        {hasManufacturerLogo(brand) ? (
          <img src={getManufacturerLogoUrl(brand)} alt={brand} className="h-16 w-auto object-contain opacity-20" />
        ) : (
          <svg className="w-24 h-24 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="aspect-square bg-white rounded-2xl border border-mlborder-light flex items-center justify-center overflow-hidden mb-3 relative group">
        <img
          src={images[active]}
          alt={alt}
          className="w-full h-full object-contain p-6"
        />
        {/* Nav arrows for multi-image */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((active - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-mltext-dark" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => setActive((active + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-mltext-dark" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            {/* Counter */}
            <span className="absolute bottom-3 right-3 text-[11px] font-bold text-mltext-light bg-white/80 px-2 py-0.5 rounded-md shadow-sm">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-16 h-16 shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                i === active
                  ? "border-primary shadow-md shadow-primary/20"
                  : "border-mlborder-light hover:border-mlborder"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
