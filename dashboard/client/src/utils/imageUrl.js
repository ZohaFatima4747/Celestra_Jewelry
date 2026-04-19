/**
 * Resolves a stored product image path to a full displayable URL.
 *
 * Stored formats:
 *   /uploads/[timestamp]-[random]-full.webp  — new uploads (webp variants)
 *   Some plain filename.jpeg                 — legacy seed data
 *
 * size: 'thumb' (400px) | 'md' (800px) | 'full' (1200px)
 */

// Strip /api suffix if present, then fall back to the production backend URL.
const BASE = (() => {
  const raw = import.meta.env.VITE_API_URL || '';
  const stripped = raw.replace(/\/api\/?$/, '');
  return stripped || 'https://celestra-backend-56ab2d90c7be.herokuapp.com';
})();

export function resolveImage(url, size = 'full') {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  if (url.startsWith('/uploads/')) {
    if (url.endsWith('-full.webp') && size !== 'full') {
      return `${BASE}${url.replace(/-full\.webp$/, `-${size}.webp`)}`;
    }
    return `${BASE}${url}`;
  }

  // Legacy seed filename — served from /product-images on the backend
  return `${BASE}/product-images/${encodeURIComponent(url)}`;
}
