/**
 * Resolves product image filenames to displayable URLs.
 *
 * Priority:
 *  1. Full URL (http/https) → used as-is
 *  2. Server path (/uploads/...) → prepend API base, swap variant suffix
 *  3. Legacy filename → /product-images/<filename>
 *  4. Fallback → empty string
 */

// Always fall back to the production backend URL so images work even if the
// env var is missing at build time (e.g. Vercel deployment without VITE_API_BASE_URL set).
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://celestra-backend-56ab2d90c7be.herokuapp.com';

export function resolveImage(filename, size = 'full') {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;

  if (filename.startsWith('/uploads/') || filename.startsWith('/assets/')) {
    if (filename.endsWith('-full.webp') && size !== 'full') {
      return `${BASE}${filename.replace(/-full\.webp$/, `-${size}.webp`)}`;
    }
    return `${BASE}${filename}`;
  }

  // Legacy seed images — served from /product-images on the backend
  return `${BASE}/product-images/${encodeURIComponent(filename)}`;
}

/**
 * Returns src + srcSet + sizes for responsive <img> rendering.
 *
 * New uploads (webp variants): 3-stop srcSet (400w / 800w / 1200w)
 * Legacy JPEGs: single src — no srcSet (browser can't resize them)
 *
 * sizes attribute reflects actual rendered widths:
 *  - Mobile grid (2-col): ~50vw minus gap → 45vw
 *  - Tablet (3-col): ~33vw → 30vw
 *  - Desktop (4-col): ~25vw → 300px max
 *  - Product detail main image: up to 600px
 */
export function resolveImageSrcSet(filename) {
  const full = resolveImage(filename, 'full');

  const isNewUpload = Boolean(
    filename &&
    (filename.startsWith('/uploads/') || filename.startsWith('http')) &&
    filename.endsWith('-full.webp')
  );

  if (!isNewUpload) {
    // Legacy JPEG — just return the single src, no srcSet
    return { src: full, srcSet: undefined, sizes: undefined };
  }

  const md    = resolveImage(filename, 'md');
  const thumb = resolveImage(filename, 'thumb');

  return {
    src:    full,
    srcSet: `${thumb} 400w, ${md} 800w, ${full} 1200w`,
    // Accurate sizes: matches the actual CSS grid column widths at each breakpoint
    sizes: [
      '(max-width: 360px) calc(100vw - 24px)',   // 1-col on tiny screens
      '(max-width: 600px) calc(50vw - 14px)',    // 2-col mobile grid
      '(max-width: 900px) calc(50vw - 20px)',    // 2-col tablet
      '(max-width: 1100px) calc(33vw - 20px)',   // 3-col
      '300px',                                    // 4-col desktop
    ].join(', '),
  };
}

export default {};
