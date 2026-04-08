import { createContext, useContext, useState, useCallback } from "react";
import { getUserId } from "../utils/auth";
import { CART_URL, PROD_URL } from "../utils/api";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const fetchCart = useCallback(() => {
    const userId = getUserId();
    if (!userId) {
      try {
        const saved = localStorage.getItem("guestCart");
        setCartItems(saved ? JSON.parse(saved) : []);
      } catch { setCartItems([]); }
      return;
    }
    fetch(`${CART_URL}?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => setCartItems(data.items || []))
      .catch(() => {});
  }, []);

  const addToCart = useCallback((productId, productObj = null, qty = 1, selectedSize = null, selectedColor = null) => {
    const userId = getUserId();

    if (!userId) {
      const doAdd = (product) => {
        const saved = localStorage.getItem("guestCart");
        const cart  = saved ? JSON.parse(saved) : [];
        const existing = cart.find(
          (i) => i.product._id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
        );
        if (existing) existing.qty += qty;
        else cart.push({ _id: `guest_${productId}_${selectedSize || ""}_${selectedColor || ""}`, product, qty, selectedSize, selectedColor });
        localStorage.setItem("guestCart", JSON.stringify(cart));
        setCartItems([...cart]);
      };

      if (productObj) doAdd(productObj);
      else fetch(`${PROD_URL}/${productId}`).then((r) => r.json()).then((p) => {
        if (p && p._id) doAdd(p);
      });
      return;
    }

    // Optimistic update for logged-in users
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.product?._id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
      );
      if (existing) return prev.map((i) =>
        i.product?._id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
          ? { ...i, qty: i.qty + qty }
          : i
      );
      if (productObj) return [...prev, { _id: `temp_${productId}_${selectedSize || ""}_${selectedColor || ""}`, product: productObj, qty, selectedSize, selectedColor }];
      return prev;
    });

    // Send a single request with the full qty — backend merges into one item
    fetch(`${CART_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId, qty, selectedSize, selectedColor }),
    }).then(fetchCart);
  }, [fetchCart]);

  const removeItem = useCallback((cartItemId) => {
    const userId = getUserId();
    if (!userId) {
      const saved = localStorage.getItem("guestCart");
      const cart  = saved ? JSON.parse(saved) : [];
      const idx   = cart.findIndex((i) => i._id === cartItemId);
      if (idx === -1) return;
      if (cart[idx].qty > 1) cart[idx].qty -= 1; else cart.splice(idx, 1);
      localStorage.setItem("guestCart", JSON.stringify(cart));
      setCartItems([...cart]);
      return;
    }
    fetch(`${CART_URL}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cartItemId }),
    }).then(fetchCart);
  }, [fetchCart]);

  const deleteItem = useCallback((cartItemId) => {
    const userId = getUserId();
    if (!userId) {
      const saved = localStorage.getItem("guestCart");
      const cart  = saved ? JSON.parse(saved) : [];
      const idx   = cart.findIndex((i) => i._id === cartItemId);
      if (idx !== -1) cart.splice(idx, 1);
      localStorage.setItem("guestCart", JSON.stringify(cart));
      setCartItems([...cart]);
      return;
    }
    // Optimistic update
    setCartItems((prev) => prev.filter((i) => i._id !== cartItemId));
    fetch(`${CART_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cartItemId }),
    }).then(fetchCart);
  }, [fetchCart]);

  const increaseQty = useCallback((cartItemId) => {
    const userId = getUserId();
    if (!userId) {
      const saved = localStorage.getItem("guestCart");
      const cart  = saved ? JSON.parse(saved) : [];
      const item  = cart.find((i) => i._id === cartItemId);
      if (item) item.qty += 1;
      localStorage.setItem("guestCart", JSON.stringify(cart));
      setCartItems([...cart]);
      return;
    }
    const cartItem = cartItems.find((i) => i._id === cartItemId);
    if (!cartItem) return;
    fetch(`${CART_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        productId: cartItem.product._id,
        qty: 1,
        selectedSize: cartItem.selectedSize || null,
        selectedColor: cartItem.selectedColor || null,
      }),
    }).then(fetchCart);
  }, [cartItems, fetchCart]);

  const clearCart = useCallback(() => setCartItems([]), []);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount: cartItems.length,
      fetchCart,
      addToCart,
      removeItem,
      deleteItem,
      increaseQty,
      clearCart,
      setCartItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
