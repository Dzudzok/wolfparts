/**
 * TecAlliance Pegasus 3.0 — Media/Documents API
 * Used for car photos and product images
 */

const API_KEY = "2BeBXg67wzbzFCs4QjwPEUsEm5Xq3Hq37sNWymUuuMXDp2BQU3Tc";
const BASE = "https://webservice.tecalliance.services/pegasus-3-0/documents/415";

/**
 * Get car photo URL by engine/K-type ID
 * Example: getCarPhotoUrl(3726) → BMW 3 kupé photo
 */
export function getCarPhotoUrl(engineId: number | string): string {
  return `${BASE}/DR${engineId}/0?api_key=${API_KEY}`;
}

/**
 * Get product/article image URL by TecAlliance document ID
 * These IDs come from the mroauto.cz product pages (data-flex-async-image-src)
 */
export function getDocumentUrl(documentId: number | string): string {
  return `${BASE}/${documentId}/0?api_key=${API_KEY}`;
}

/**
 * Proxy-safe URL — use this in <img> tags to avoid exposing API key client-side
 * Routes through our /api/tecdoc-image proxy
 */
export function getCarPhotoProxyUrl(engineId: number | string): string {
  return `/api/tecdoc-image?type=car&id=${engineId}`;
}

export function getDocumentProxyUrl(documentId: number | string): string {
  return `/api/tecdoc-image?type=doc&id=${documentId}`;
}
