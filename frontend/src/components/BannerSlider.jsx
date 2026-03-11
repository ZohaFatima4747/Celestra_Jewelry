import React from "react";
import "./BannerSlider.css";

const BannerSlider = ({ onShopNow }) => {
  return (
    <div className="banner-wrap">
      <div className="banner-hero">
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="banner-content">
          <div className="banner-tag">⚡ New Arrivals 2025</div>
          <h1 className="banner-title">
            Next-Gen <span className="highlight">Electronics</span>
            <br />
            for Modern Life
          </h1>
          <p className="banner-subtitle">
            Discover premium gadgets, wearables & smart home devices — all at
            Grace.
          </p>
          <div className="banner-btns">
            <button className="btn-primary" onClick={onShopNow}>
              Shop Now →
            </button>
          </div>

          <div className="banner-stats">
            <div className="bstat">
              <strong>20+</strong>
              <span>Products</span>
            </div>
            <div className="bstat-divider" />
            <div className="bstat">
              <strong>6</strong>
              <span>Categories</span>
            </div>
            <div className="bstat-divider" />
            <div className="bstat">
              <strong>Free</strong>
              <span>Delivery</span>
            </div>
          </div>
        </div>

        <div className="banner-cards">
          {[
            { icon: "🎧", label: "Audio", color: "#22c55e" },
            { icon: "⌚", label: "Wearables", color: "#3b82f6" },
            { icon: "📷", label: "Camera", color: "#f59e0b" },
            { icon: "🏠", label: "Smart Home", color: "#a855f7" },
          ].map((item, i) => (
            <div
              className="banner-cat-card"
              key={i}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="bcc-icon" style={{ color: item.color }}>
                {item.icon}
              </span>
              <span className="bcc-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerSlider;
