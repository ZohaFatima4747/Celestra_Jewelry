import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ContactForm from "./components/ContactForm";
import Shop from "./Shop";
import AdminDashboard from "./components/Admin";
import OwnerDashboard from "./components/OwnerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ContactForm />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
