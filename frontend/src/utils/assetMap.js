/**
 * Resolves product image filenames to displayable URLs.
 *
 * Legacy JPEG assets live in /public/product-images/ — served as static files
 * by both Vite dev/preview and the Express backend, no JS bundle cost.
 *
 * Priority:
 *  1. Full URL (http/https) → used as-is
 *  2. Server path (/uploads/...) → prepend API base, swap variant suffix
 *  3. Legacy filename → /product-images/<filename>
 *  4. Fallback → empty string
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export function resolveImage(filename, size = 'full') {
  if (!filename) return '';

  // Already a full URL
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;

  // New uploads: /uploads/<base>-full.webp
  if (filename.startsWith('/uploads/') || filename.startsWith('/assets/')) {
    if (filename.endsWith('-full.webp') && size !== 'full') {
      return `${BASE}${filename.replace(/-full\.webp$/, `-${size}.webp`)}`;
    }
    return `${BASE}${filename}`;
  }

  // Legacy assets — served from public/product-images/ (no backend required)
  return `/product-images/${filename}`;
}

/**
 * Returns src + srcSet + sizes for responsive <img> rendering.
 * New uploads get a 3-stop srcSet (400w / 800w / 1200w).
 * Legacy assets fall back to a single src.
 */
export function resolveImageSrcSet(filename) {
  const full = resolveImage(filename, 'full');
  const isNewUpload = Boolean(
    filename &&
    (filename.startsWith('/uploads/') || filename.startsWith('http')) &&
    filename.endsWith('-full.webp')
  );

  if (!isNewUpload) return { src: full, srcSet: undefined, sizes: undefined };

  const md    = resolveImage(filename, 'md');
  const thumb = resolveImage(filename, 'thumb');

  return {
    src:    full,
    srcSet: `${thumb} 400w, ${md} 800w, ${full} 1200w`,
    sizes:  '(max-width: 480px) 200px, (max-width: 900px) 400px, 600px',
  };
}

export default {};
