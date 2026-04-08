import React from "react";
import "./CelestraLogo.css";

/**
 * Animated Celestra logo.
 * size: "navbar" (76px) | "footer" (90px) | "lg" (220px)
 *
 * On mobile (≤600px) the navbar variant automatically swaps to a flat
 * hexagon + wordmark design matching the brand image.
 */
const CelestraLogo = ({ size = "navbar", onClick }) => (
  <>
    {/* Animated circular logo — hidden on mobile when size="navbar" */}
    <div className={`celestra-logo logo-${size}`} onClick={onClick}>
      <div className="logo-bg" />
      <div className="orbit-ring" />
      <div className="logo-center">
        <div className="logo-name">CELESTRA</div>
        <div className="logo-sub">JEWELRY</div>
      </div>
    </div>

    {/* Flat hexagon logo — shown only on mobile when size="navbar" */}
    {size === "navbar" && (
      <div className="celestra-logo-flat" onClick={onClick}>
        <div className="flat-hex">
          <svg viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 2L37.3 12V32L20 42L2.7 32V12L20 2Z"
              stroke="#b8952a"
              strokeWidth="1.5"
              fill="none"
            />
            <text
              x="50%"
              y="55%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontFamily="Cinzel, serif"
              fontSize="14"
              fontWeight="600"
              fill="#ddd8cc"
            >c</text>
          </svg>
        </div>
        <div className="flat-text">
          <span className="flat-name">CELESTRA</span>
          <span className="flat-sub">Jewelry Atelier</span>
        </div>
      </div>
    )}
  </>
);

export default CelestraLogo;
