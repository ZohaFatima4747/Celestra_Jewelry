import { useState } from "react";
import { resolveImageSrcSet } from "../utils/assetMap";
import "./ProductImage.css";

/**
 * Optimized product image with:
 * - Skeleton placeholder (no layout shift — aspect-ratio locked by CSS)
 * - Lazy loading via native loading="lazy"
 * - Responsive srcSet for new uploads (400w / 800w / 1200w)
 * - Graceful error fallback
 * - object-fit: contain so images are never cropped or stretched
 *
 * Props:
 *   filename  — value from product.images[n]
 *   alt       — alt text
 *   className — extra class on the wrapper
 *   eager     — set true for above-the-fold images (LCP candidates)
 */
const ProductImage = ({ filename, alt = "", className = "", eager = false }) => {
  const [loaded, setLoaded]   = useState(false);
  const [errored, setErrored] = useState(false);

  const { src, srcSet, sizes } = resolveImageSrcSet(filename);

  return (
    <div className={`pi-wrap ${className}`}>
      {/* Skeleton shown until image loads */}
      {!loaded && !errored && <div className="pi-skeleton" aria-hidden="true" />}

      {errored ? (
        <div className="pi-error" aria-label="Image unavailable">
          <span>🖼️</span>
        </div>
      ) : (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(true); setErrored(true); }}
          className={`pi-img ${loaded ? "pi-img--visible" : ""}`}
        />
      )}
    </div>
  );
};

export default ProductImage;
