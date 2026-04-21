import { Helmet } from "react-helmet-async";

const SITE_NAME  = "Celestra Jewelry";
const SITE_URL   = import.meta.env.VITE_SITE_URL || "https://celestraa.com";
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;

/**
 * Reusable SEO component — wraps react-helmet-async.
 *
 * Props:
 *   title        — page title (appended with " – Celestra Jewelry")
 *   description  — meta description
 *   image        — absolute OG image URL (defaults to brand OG image)
 *   url          — canonical URL for this page
 *   type         — OG type: "website" | "product" (default: "website")
 *   noIndex      — set true to block indexing (admin pages)
 *   structuredData — JSON-LD object to inject as structured data
 */
const SEO = ({
  title,
  description,
  image,
  url,
  type = "website",
  noIndex = false,
  structuredData,
}) => {
  const fullTitle  = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – Luxury Handcrafted Jewelry in Pakistan`;
  const metaDesc   = description || "Discover Celestra Jewelry – premium handcrafted rings, bracelets, earrings, chains and more. Free nationwide delivery across Pakistan.";
  const ogImage    = image || DEFAULT_OG;
  const canonical  = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {noIndex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow" />
      }
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt"   content={fullTitle} />
      <meta property="og:url"         content={canonical} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@celestrajewelry" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image"       content={ogImage} />
      <meta name="twitter:image:alt"   content={fullTitle} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
