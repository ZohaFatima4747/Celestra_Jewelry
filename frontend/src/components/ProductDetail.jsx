import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartModal from "./CartModal";
import CheckoutModal from "./CheckoutModal";
import ProductImage from "./ProductImage";
import SEO from "./SEO";
import { useCart } from "../context/CartContext";
import { getUserId } from "../utils/auth";
import { PROD_URL } from "../utils/api";
import { fetchCached } from "../utils/productCache";
import {
  toggleWishlist as doToggleWishlist,
  isGuestWishlisted,
  fetchUserWishlist,
} from "../utils/wishlist";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Global cart state ──────────────────────────────────────
  const { cartItems, cartCount, fetchCart, addToCart, removeItem, deleteItem, increaseQty, setCartItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ── Search state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (q) => {
    setSearchQuery(q);
    if (q.trim()) navigate(`/?search=${encodeURIComponent(q.trim())}`);
  };

  // ── Local page state ───────────────────────────────────────
  const [product, setProduct]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [related, setRelated]           = useState([]);
  const [activeImg, setActiveImg]       = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty]                   = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartMsg, setCartMsg]           = useState("");

  // Fetch product + related — uses cache so navigating back is instant
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImg(0);
    setQty(1);
    setSelectedSize(null);
    setSelectedColor(null);

    let cancelled = false;

    fetchCached(`${PROD_URL}/${id}`)
      .then((found) => {
        if (cancelled) return;
        setProduct(found);
        setLoading(false);
        // Fetch related in parallel — also cached
        if (found.category) {
          fetchCached(`${PROD_URL}?category=${encodeURIComponent(found.category)}&limit=5`)
            .then((data) => {
              if (!cancelled) setRelated(data.filter((p) => p._id !== id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) { setProduct(null); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [id]);

  // Fetch wishlist status — runs after product loads
  useEffect(() => {
    if (!product) return;
    const userId = getUserId();
    if (userId) {
      fetchUserWishlist()
        .then((list) => setIsWishlisted(list.some((p) => p.productId._id === product._id)))
        .catch(() => {});
    } else {
      setIsWishlisted(isGuestWishlisted(product._id));
    }
  }, [product?._id]);

  // Sync cart on mount
  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMsg("Please select a size first");
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      setCartMsg("Please select a color first");
      return;
    }
    addToCart(product._id, product, qty, selectedSize, selectedColor);
    setCartMsg("Added to cart!");
    setTimeout(() => setCartMsg(""), 2500);
  };

  const handleOrderSuccess = (message) => {
    setCartItems([]);
    localStorage.removeItem("guestCart");
    setShowPayment(false);
    setCartOpen(false);
    alert(message);
  };

  const toggleWishlist = async () => {
    const added = await doToggleWishlist(product._id);
    setIsWishlisted(added);
  };

  // ── Loading / not found ────────────────────────────────────
  if (loading) return <div className="pd-loading"><div className="pd-spinner" /></div>;
  if (!product) return (
    <div className="pd-not-found">
      <p>Product not found.</p>
      <button onClick={() => navigate("/")}>← Back to Shop</button>
    </div>
  );

  // Keep raw filenames — ProductImage handles resolution + srcSet
  const gallery = product.images?.length ? product.images : [];
  const isOutOfStock = product.stock === 0;

  // Build absolute OG image URL for social sharing
  const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.celestrajewelry.com";
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const rawImg   = gallery[0] || "";
  const ogImage  = rawImg.startsWith("http")
    ? rawImg
    : rawImg.startsWith("/uploads/")
      ? `${API_BASE}${rawImg}`
      : `${SITE_URL}/og-image.jpg`;

  const productSLD = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} – a beautifully crafted piece by Celestra Jewelry.`,
    "image": ogImage,
    "brand": { "@type": "Brand", "name": "Celestra Jewelry" },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "PKR",
      "price": product.price,
      "availability": isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "url": `${SITE_URL}/product/${product._id}`,
    },
    ...(product.rating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.numReviews || 1,
      },
    }),
  };

  return (
    <>
      <SEO
        title={product.name}
        description={
          product.description
            ? product.description.slice(0, 155)
            : `Shop ${product.name} at Celestra Jewelry. Premium handcrafted ${product.category || "jewelry"} with free delivery across Pakistan.`
        }
        image={ogImage}
        url={`/product/${product._id}`}
        type="product"
        structuredData={productSLD}
      />
      <Navbar
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCategorySelect={() => navigate("/")}
      />

      <div className="pd-wrap">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <button className="pd-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <span onClick={() => navigate("/")}>Home</span>
          <span className="pd-bc-sep">›</span>
          <span onClick={() => navigate("/")}>
            {product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : "Shop"}
          </span>
          <span className="pd-bc-sep">›</span>
          <span className="pd-bc-current">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="pd-grid">

          {/* Gallery */}
          <div className="pd-gallery">
            <div className="pd-thumbs">
              {gallery.map((filename, i) => (
                <div key={i} className={`pd-thumb ${activeImg === i ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                  <ProductImage filename={filename} alt={`${product.name} view ${i + 1}`} />
                </div>
              ))}
            </div>
            <div className="pd-main-img">
              {/* First image is LCP candidate — load eagerly */}
              <ProductImage filename={gallery[activeImg]} alt={product.name} eager={activeImg === 0} />
              {isOutOfStock && <div className="pd-sold-out-badge">Sold Out</div>}
            </div>
          </div>

          {/* Info */}
          <div className="pd-info">
            <span className="pd-category">{product.category}</span>
            <h1 className="pd-name">{product.name}</h1>

            {product.rating > 0 && (
              <div className="pd-rating">
                <span className="pd-stars">{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</span>
                <span className="pd-rating-num">{product.rating.toFixed(1)}</span>
                {product.numReviews > 0 && <span className="pd-reviews">({product.numReviews} reviews)</span>}
              </div>
            )}

            <div className="pd-price-row">
              <span className="pd-price">Rs {product.price?.toLocaleString()}</span>
              <span className={`pd-stock-tag ${isOutOfStock ? "out" : "in"}`}>
                {isOutOfStock ? "Out of Stock" : `In Stock (${product.stock})`}
              </span>
            </div>

            <div className="pd-divider" />

            <p className="pd-desc">{product.description || "A beautifully crafted piece, made with the finest materials."}</p>

            {/* Color */}
            {product.colors?.length > 0 && (
              <div className="pd-option-group">
                <div className="pd-option-label">Color: <span>{selectedColor || "Select"}</span></div>
                <div className="pd-colors">
                  {product.colors.map((c) => (
                    <button key={c} className={`pd-size-btn ${selectedColor === c ? "active" : ""}`}
                      onClick={() => setSelectedColor(c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div className="pd-option-group">
                <div className="pd-option-label">Size: <span>{selectedSize || "Select"}</span></div>
                <div className="pd-sizes">
                  {product.sizes.map((s) => (
                    <button key={s} className={`pd-size-btn ${selectedSize === s ? "active" : ""}`} onClick={() => setSelectedSize(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="pd-option-group">
              <div className="pd-option-label">Quantity:</div>
              <div className="pd-qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            </div>

            {/* CTA */}
            <div className="pd-cta">
              <button className="pd-add-btn" onClick={handleAddToCart} disabled={isOutOfStock}>
                {isOutOfStock ? "Sold Out" : "Add to Cart"}
              </button>
              <button className={`pd-wish-btn ${isWishlisted ? "active" : ""}`} onClick={toggleWishlist}
                title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}>
                {isWishlisted ? "❤️" : "🤍"}
              </button>
            </div>

            {cartMsg && (
              <div className={`pd-cart-msg ${cartMsg.startsWith("Please") ? "pd-cart-msg--error" : ""}`}>
                {cartMsg}
              </div>
            )}

            <div className="pd-trust">
              <div className="pd-trust-item"><span>✦</span> Free gift wrapping</div>
              <div className="pd-trust-item"><span>✦</span> Free nationwide delivery</div>
              <div className="pd-trust-item"><span>✦</span> Easy 30-day returns</div>
              <div className="pd-trust-item"><span>✦</span> Premium quality metals</div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="pd-related">
            <h2 className="pd-related-title">You may also <em>like</em></h2>
            <div className="pd-related-grid">
              {related.map((p) => (
                <div key={p._id} className="pd-rel-card" onClick={() => { navigate(`/product/${p._id}`); window.scrollTo(0, 0); }}>
                  <div className="pd-rel-img"><ProductImage filename={p.images?.[0]} alt={p.name} /></div>
                  <div className="pd-rel-info">
                    <span className="pd-rel-cat">{p.category}</span>
                    <div className="pd-rel-name">{p.name}</div>
                    <div className="pd-rel-price">Rs {p.price?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Cart sidebar */}
      {cartOpen && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setShowPayment(true); }}
          removeItem={removeItem}
          deleteItem={deleteItem}
          increaseQty={increaseQty}
        />
      )}

      {showPayment && (
        <CheckoutModal
          cartItems={cartItems}
          totalAmount={cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0)}
          onSuccess={handleOrderSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
};

export default ProductDetail;
