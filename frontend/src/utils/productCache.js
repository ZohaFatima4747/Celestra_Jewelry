/**
 * productCache.js
 * In-memory cache for product API responses.
 * Survives React re-renders and SPA navigation — cleared only on page refresh.
 *
 * TTL: 5 minutes. Stale entries are re-fetched transparently.
 */

const TTL = 5 * 60 * 1000; // 5 min

const store = new Map(); // key → { data, ts }

function isValid(entry) {
  return entry && Date.now() - entry.ts < TTL;
}

export function getCached(key) {
  const entry = store.get(key);
  return isValid(entry) ? entry.data : null;
}

export function setCached(key, data) {
  store.set(key, { data, ts: Date.now() });
}

export function invalidate(key) {
  store.delete(key);
}

/**
 * Fetch with cache. Returns cached data immediately if fresh,
 * otherwise fetches, caches, and returns.
 */
export async function fetchCached(url) {
  const hit = getCached(url);
  if (hit !== null) return hit;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  setCached(url, data);
  return data;
}

/**
 * Prefetch a URL into cache without blocking the caller.
 * Safe to call on hover — deduplicates in-flight requests.
 */
const inflight = new Set();

export function prefetch(url) {
  if (getCached(url) !== null || inflight.has(url)) return;
  inflight.add(url);
  fetch(url)
    .then((r) => r.ok ? r.json() : null)
    .then((data) => { if (data) setCached(url, data); })
    .catch(() => {})
    .finally(() => inflight.delete(url));
}
