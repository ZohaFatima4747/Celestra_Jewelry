import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Shop from "./Shop";

const ContactForm   = lazy(() => import("./components/ContactForm"));
const ContactUs     = lazy(() => import("./pages/ContactUs"));
const AdminDashboard  = lazy(() => import("./components/Admin"));
const OwnerDashboard  = lazy(() => import("./components/OwnerDashboard"));
const ProductDetail   = lazy(() => import("./components/ProductDetail"));

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/ContactForm" element={<ContactForm />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/owner" element={<OwnerDashboard />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
