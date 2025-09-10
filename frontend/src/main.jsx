import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/index.css";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookingPage from "./pages/admin/AdminBookingPage";
import AdminCarPage from "./pages/admin/AdminCarPage";
import AdminManageUser from "./pages/admin/AdminManageUser";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
import AdminTransactionPage from "./pages/admin/AdminTransactionPage";
import AdminReportAnalytics from "./pages/admin/AdminReportAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/manage-booking" element={<AdminBookingPage />} />
        <Route path="/manage-car" element={<AdminCarPage />} />
        <Route path="/manage-user" element={<AdminManageUser />} />
        <Route path="/schedule" element={<AdminSchedulePage />} />
        <Route path="/transaction-logs" element={<AdminTransactionPage />} />
        <Route path="/report-analytics" element={<AdminReportAnalytics />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
