/**
 * Centralised API base URLs.
 * Falls back to the production Heroku backend if the env var isn't set at build time.
 */
export const BASE_URL  = import.meta.env.VITE_API_BASE_URL || "https://celestra-backend-56ab2d90c7be.herokuapp.com";
export const API       = `${BASE_URL}/api`;
export const AUTH_URL  = `${API}/v1/auth`;
export const CART_URL  = `${API}/cart`;
export const ORDER_URL = `${API}/orders`;
export const WISH_URL  = `${API}/wishlist`;
export const MSG_URL   = `${API}/messages`;
export const PROD_URL  = `${API}/products`;
export const CONTACT_URL = `${API}/contact-us`;

/** Fetch a single product by ID */
export const getProduct = (id) => fetch(`${PROD_URL}/${id}`).then((r) => r.json());

/** Fetch dynamic price range { min, max } */
export const getPriceRange = () => fetch(`${PROD_URL}/price-range`).then((r) => r.json());

/** Fetch distinct categories as string[] */
export const getCategories = () => fetch(`${PROD_URL}/categories`).then((r) => r.json());
