"use client";

/**
 * Get user token from localStorage (if logged in and not expired)
 */
export function getUserToken(): string | null {
  try {
    const token = localStorage.getItem("auth_token");
    const validTo = localStorage.getItem("auth_valid_to");
    if (token && validTo && new Date(validTo) > new Date()) {
      return token;
    }
  } catch {}
  return null;
}

/**
 * Build fetch headers with optional user token
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const token = getUserToken();
  if (token) headers["x-user-token"] = token;
  return headers;
}

/**
 * Fetch with user token automatically attached
 */
export function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getUserToken();
  const headers = new Headers(options?.headers);
  if (token) headers.set("x-user-token", token);
  return fetch(url, { ...options, headers });
}
