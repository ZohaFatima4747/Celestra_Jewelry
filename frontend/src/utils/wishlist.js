/**
 * wishlist.js — unified wishlist helpers for guest + logged-in users.
 *
 * Guest wishlist: localStorage key "guestWishlist" → string[]  (productIds)
 * Logged-in:      POST /api/wishlist/add  (token in Authorization header)
 *                 GET  /api/wishlist
 *                 POST /api/wishlist/merge  (called once on login/signup)
 */
import api from "./axiosInstance";
import { WISH_URL, PROD_URL } from "./api";
import { getUserId } from "./auth";

// ── Guest helpers ─────────────────────────────────────────────────────────────

export const getGuestWishlist = () => {
  try { return JSON.parse(localStorage.getItem("guestWishlist") || "[]"); }
  catch { return []; }
};

export const setGuestWishlist = (ids) =>
  localStorage.setItem("guestWishlist", JSON.stringify(ids));

export const clearGuestWishlist = () => localStorage.removeItem("guestWishlist");

export const isGuestWishlisted = (productId) =>
  getGuestWishlist().includes(productId);

export const toggleGuestWishlist = (productId) => {
  const ids = getGuestWishlist();
  const idx = ids.indexOf(productId);
  if (idx > -1) ids.splice(idx, 1);
  else          ids.push(productId);
  setGuestWishlist(ids);
  return idx === -1; // true = added
};

// ── Logged-in helpers ─────────────────────────────────────────────────────────

/** Toggle add/remove for logged-in user. Returns { added: bool } */
export const toggleUserWishlist = async (productId) => {
  const { data } = await api.post(`${WISH_URL}/add`, { productId });
  return data.added;
};

/** Fetch full wishlist for logged-in user (populated products) */
export const fetchUserWishlist = async () => {
  const { data } = await api.get(WISH_URL);
  return data.success ? data.wishlist : [];
};

/** Fetch guest wishlist as populated product objects */
export const fetchGuestWishlistProducts = async () => {
  const ids = getGuestWishlist();
  if (!ids.length) return [];
  const results = await Promise.all(
    ids.map((id) =>
      fetch(`${PROD_URL}/${id}`)
        .then((r) => r.json())
        .catch(() => null)
    )
  );
  return results.filter(Boolean).map((p) => ({ productId: p }));
};

// ── Merge on login/signup ─────────────────────────────────────────────────────

/**
 * Call after a successful login/signup.
 * Sends guest wishlist IDs to backend for merging, then clears localStorage.
 */
export const mergeWishlistOnAuth = async () => {
  const ids = getGuestWishlist();
  if (!ids.length) return;
  try {
    await api.post(`${WISH_URL}/merge`, { guestWishlist: ids });
    clearGuestWishlist();
  } catch { /* non-critical — silently ignore */ }
};

// ── Unified toggle (auto-detects guest vs logged-in) ─────────────────────────

export const toggleWishlist = async (productId) => {
  const userId = getUserId();
  if (!userId) return toggleGuestWishlist(productId);
  return toggleUserWishlist(productId);
};

export const isWishlisted = async (productId) => {
  const userId = getUserId();
  if (!userId) return isGuestWishlisted(productId);
  try {
    const list = await fetchUserWishlist();
    return list.some((p) => p.productId._id === productId);
  } catch { return false; }
};
