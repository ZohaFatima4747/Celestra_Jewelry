import { createContext, useContext, useState, useCallback } from "react";
import { getUserId } from "../utils/auth";
import { CART_URL, PROD_URL } from "../utils/api";
import api from "../utils/axiosInstance";

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
    api.get(`${CART_URL}?userId=${userId}`)
      .then((r) => setCartItems(r.data.items || []))
      .catch(() => {});
  }, []);

  const addToCart = useCallback((productId, productObj = null, qty = 1, selectedSize = null, selectedColor = null) => {
    const userId = getUserId();

    // ── Guest path: store in localStorage ────────────────────────────────────
    if (!userId) {
      const doAdd = (product) => {
        const saved = localStorage.getItem("guestCart");
        const cart  = saved ? JSON.parse(saved) : [];
        const existing = cart.find(
          (i) => i.product._id === productId &&
                 i.selectedSize === selectedSize &&
                 i.selectedColor === selectedColor
        );
        if (existing) existing.qty += qty;
        else cart.push({
          _id: `guest_${productId}_${selectedSize || ""}_${selectedColor || ""}`,
          product, qty, selectedSize, selectedColor,
        });
        localStorage.setItem("guestCart", JSON.stringify(cart));
        setCartItems([...cart]);
      };

      if (productObj) {
        doAdd(productObj);
      } else {
        fetch(`${PROD_URL}/${productId}`)
          .then((r) => r.json())
          .then((p) => { if (p?._id) doAdd(p); });
      }
      return;
    }

    // ── Logged-in path: optimistic update then sync ───────────────────────────
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.product?._id === productId &&
               i.selectedSize === selectedSize &&
               i.selectedColor === selectedColor
      );
      if (existing) {
        return prev.map((i) =>
          i.product?._id === productId &&
          i.selectedSize === selectedSize &&
          i.selectedColor === selectedColor
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      if (productObj) {
        return [...prev, {
          _id: `temp_${productId}_${selectedSize || ""}_${selectedColor || ""}`,
          product: productObj, qty, selectedSize, selectedColor,
        }];
      }
      return prev;
    });

    api.post(`${CART_URL}/add`, { userId, productId, qty, selectedSize, selectedColor })
      .then(fetchCart)
      .catch(() => fetchCart()); // re-sync on error to revert optimistic update
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
    api.post(`${CART_URL}/remove`, { userId, cartItemId }).then(fetchCart);
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
    setCartItems((prev) => prev.filter((i) => i._id !== cartItemId));
    api.post(`${CART_URL}/delete`, { userId, cartItemId }).then(fetchCart);
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
    api.post(`${CART_URL}/add`, {
      userId,
      productId:     cartItem.product._id,
      qty:           1,
      selectedSize:  cartItem.selectedSize  || null,
      selectedColor: cartItem.selectedColor || null,
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
