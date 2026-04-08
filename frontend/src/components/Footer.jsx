import { useNavigate } from "react-router-dom";
import "./Footer.css";
import logo from "../assets/logo.jpeg";

const SHOP_CATEGORIES = [
  { label: "Rings",        value: "rings" },
  { label: "Handcuff",     value: "handcuff" },
  { label: "Hand Harness", value: "hand harness" },
  { label: "Earrings",     value: "earrings" },
  { label: "Bracelets",    value: "bracelets" },
  { label: "Chains",       value: "chains" },
];

const Footer = () => {
  const navigate = useNavigate();

  const goToCategory = (category) => {
    navigate(`/?category=${encodeURIComponent(category)}`);
    setTimeout(() => {
      document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
  <footer className="footer">
    <div className="footer-main">

      {/* Brand — left */}
      <div className="footer-col footer-brand">
        <div className="footer-brand-inner">
          <div className="footer-logo-wrap">
            <img src={logo} alt="Celestra Jewelry" className="footer-logo-img" />
          </div>
          <p className="footer-tagline">
            Fine jewellery inspired by the cosmos. Crafted for those who carry light within them.
          </p>
        </div>
      </div>

      {/* Right columns — right-aligned */}
      <div className="footer-right-cols">
        <div className="footer-col">
          <div className="footer-heading">Shop</div>
          <ul>
            {SHOP_CATEGORIES.map(({ label, value }) => (
              <li key={value} onClick={() => goToCategory(value)}>{label}</li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <div className="footer-heading">Connect</div>
          <ul>
            <li onClick={() => navigate("/contact-us")}>Contact Us</li>
          </ul>
        </div>
      </div>

    </div>

    <div className="footer-bottom">
      <span>© 2025 Celestra Jewelry. All rights reserved.</span>
      <div className="footer-payments">
        <span className="pay-badge">JazzCash</span>
        <span className="pay-badge">EasyPaisa</span>
        <span className="pay-badge">Bank Transfer</span>
        <span className="pay-badge">COD</span>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
