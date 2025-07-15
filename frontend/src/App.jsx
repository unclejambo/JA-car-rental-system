import "./styles/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useState } from 'react'

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCarPage from "./pages/admin/AdminCarPage";
import AdminBookingPage from "./pages/admin/AdminBookingPage";
import AdminManageUser from "./pages/admin/AdminManageUser";
import AdminReportAnalytics from "./pages/admin/AdminReportAnalytics";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTransactionPage from "./pages/admin/AdminTransactionPage";
// import CustomerDashboard from "./pages/customer/customerDashboard";

function App() {
  return (
    <div className="h-[100vh] w-[98.9vw]">
      <BrowserRouter>
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-booking" element={<AdminBookingPage />} />
          <Route path="/admin/manage-car" element={<AdminCarPage />} />
          <Route path="/admin/manage-user" element={<AdminManageUser />} />
          <Route path="/admin/schedule" element={<AdminSchedulePage />} />
          <Route path="/admin/transaction-logs" element={<AdminTransactionPage />} />
          <Route path="/admin/report-analytics" element={<AdminReportAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
