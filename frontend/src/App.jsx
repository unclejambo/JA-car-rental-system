import "./styles/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useState } from 'react'

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
// import AdminDashboard from "./pages/admin/adminDashboard";
// import CustomerDashboard from "./pages/customer/customerDashboard";

function App() {
  return (
    <div className="h-[100vh] w-[98.9vw]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
