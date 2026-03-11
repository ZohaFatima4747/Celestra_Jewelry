import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// 🔑 Stripe PUBLISHABLE key (pk_test)
const stripePromise = loadStripe("pk_test_51Rpnd4GaJ8id7jyS1lh9GxEBfZivIVY3dHpUvvbbXh7KpRmadYpqSkXm3MaHEVCoYekFwgpAaJu6jik4S45HWzSi00lPtxtpFm");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </StrictMode>
);
