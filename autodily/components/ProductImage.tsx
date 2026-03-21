"use client";

import { useState, useEffect } from "react";
import { getManufacturerLogoUrl, hasManufacturerLogo } from "@/lib/brand-logos";

interface ProductImageProps {
  imageUrl?: string;
  productId: string;
  brand: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ imageUrl, productId, brand, alt, className = "" }: ProductImageProps) {
  const [src, setSrc] = useState(imageUrl || "");
  const [loading, setLoading] = useState(!imageUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (imageUrl || failed) return;

    let cancelled = false;
    fetch(`/api/product-image?id=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.imageUrl) setSrc(data.imageUrl);
        else if (!cancelled) setFailed(true);
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [imageUrl, productId, failed]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-primary/30 animate-spin" />
      </div>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`object-contain ${className}`}
        loading="lazy"
        onError={() => { setSrc(""); setFailed(true); }}
      />
    );
  }

  // Fallback: manufacturer logo
  if (hasManufacturerLogo(brand)) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img src={getManufacturerLogoUrl(brand)} alt={brand} className="h-8 w-auto object-contain opacity-30" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
}
