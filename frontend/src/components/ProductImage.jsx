import { useState } from "react";
import { resolveImageSrcSet } from "../utils/assetMap";
import "./ProductImage.css";

/**
 * Optimized product image:
 * - Skeleton placeholder (no layout shift — aspect-ratio locked by parent CSS)
 * - Lazy loading via native loading="lazy"
 * - Responsive srcSet for new uploads (400w / 800w / 1200w)
 * - fetchpriority="high" for above-the-fold LCP images
 * - Graceful error fallback
 *
 * Props:
 *   filename  — value from product.images[n]
 *   alt       — alt text
 *   className — extra class on the wrapper
 *   eager     — true for LCP candidates (first image on product detail page)
 */
const ProductImage = ({ filename, alt = "", className = "", eager = false }) => {
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);

  const { src, srcSet, sizes } = resolveImageSrcSet(filename);

  return (
    <div className={`pi-wrap ${className}`}>
      {!loaded && !errored && <div className="pi-skeleton" aria-hidden="true" />}

      {errored ? (
        <div className="pi-error" aria-label="Image unavailable">
          <span>🖼️</span>
        </div>
      ) : (
        <img
          src={src}
          srcSet={srcSet || undefined}
          sizes={sizes || undefined}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          // fetchpriority tells the browser to start this download immediately
          // for LCP images, before the parser reaches it
          fetchpriority={eager ? "high" : "low"}
          decoding={eager ? "sync" : "async"}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(true); setErrored(true); }}
          className={`pi-img ${loaded ? "pi-img--visible" : ""}`}
        />
      )}
    </div>
  );
};

export default ProductImage;
