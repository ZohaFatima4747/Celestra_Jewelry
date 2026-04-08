import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Navbar from "./components/Navbar";
import BannerSlider from "./components/BannerSlider";
import ProductList from "./components/ProductList";
import CartModal from "./components/CartModal";
import CheckoutModal from "./components/CheckoutModal";
import Footer from "./components/Footer";
import { useCart } from "./context/CartContext";
import "./App.css";

function Shop() {
  const { cartItems, cartCount, fetchCart, addToCart, removeItem, deleteItem, increaseQty, setCartItems } = useCart();
  const [searchParams] = useSearchParams();

  const [cartOpen,     setCartOpen]     = useState(false);
  const [showPayment,  setShowPayment]  = useState(false);
  const [searchQuery,  setSearchQuery]  = useState(searchParams.get("search") || "");
  const [navCategory,  setNavCategory]  = useState(searchParams.get("category") || "all");

  const productRef = useRef(null);

  // Sync category from URL when navigating via footer links
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setNavCategory(cat);
  }, [searchParams]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  const handleOrderSuccess = (message) => {
    setCartItems([]);
    localStorage.removeItem("guestCart");
    setShowPayment(false);
    setCartOpen(false);
    alert(message);
  };

  return (
    <div className="shop-wrapper">
      <Navbar
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <BannerSlider onShopNow={() => productRef.current?.scrollIntoView({ behavior: "smooth" })} />

      <div ref={productRef} id="shop-products">
        <ProductList
          addToCart={addToCart}
          searchQuery={searchQuery}
          navCategory={navCategory}
          onNavCategoryChange={setNavCategory}
        />
      </div>

      {cartOpen && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setCartOpen(false)}
          onCheckout={() => setShowPayment(true)}
          removeItem={removeItem}
          deleteItem={deleteItem}
          increaseQty={increaseQty}
        />
      )}

      {showPayment && (
        <CheckoutModal
          cartItems={cartItems}
          totalAmount={totalAmount}
          onSuccess={handleOrderSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default Shop;
