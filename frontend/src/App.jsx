import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import ContactForm from "./components/ContactForm";
import ContactUs from "./pages/ContactUs";
import Shop from "./Shop";
import AdminDashboard from "./components/Admin";
import OwnerDashboard from "./components/OwnerDashboard";
import ProductDetail from "./components/ProductDetail";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/ContactForm" element={<ContactForm />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/owner" element={<OwnerDashboard />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
