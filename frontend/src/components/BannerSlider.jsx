import React from "react";
import "./BannerSlider.css";
import logo from "../assets/logo.jpeg";

const TRUST = [
  { icon: "✦", text: "Handcrafted Jewellery" },
  { icon: "✦", text: "Premium Quality Metals" },
  { icon: "✦", text: "Free Nationwide Delivery" },
  { icon: "✦", text: "Easy Returns & Exchange" },
];

const BannerSlider = ({ onShopNow }) => (
  <div className="banner-wrap">
    <div className="banner-hero">
      <div className="banner-content">
        <div className="banner-tag">— New Collection &nbsp;·&nbsp; Celestra · Spring 2025</div>
        <h1 className="banner-title">
          Jewellery born<br />from the <em>night sky</em>
        </h1>
        <p className="banner-subtitle">
          Handcrafted fine jewellery by Celestra, inspired by the cosmos.
          Each piece carries the light of a thousand stars —
          made to be worn, cherished, and passed down.
        </p>
        <div className="banner-btns">
          <button className="btn-primary" onClick={onShopNow}>Explore Collection</button>
        </div>
        <div className="banner-stats">
          {[
          { val: "30+",   lbl: "Pieces" },
            { val: "6",    lbl: "Collections" },
            { val: "Free", lbl: "Delivery" },
            { val: "Easy", lbl: "Returns" },
          ].map((s, i) => (
            <div className="bstat" key={i}>
              <strong>{s.val}</strong>
              <span>{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="banner-wordmark">
        <img src={logo} alt="Celestra Logo" className="banner-logo-img" />
      </div>
    </div>

    <div className="banner-trust">
      {TRUST.map((t, i) => (
        <div className="trust-item" key={i}>
          <span className="trust-icon">{t.icon}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  </div>
);

export default BannerSlider;
