// import { useState } from 'react'
import "./styles/index.css";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/adminDashboard";
import CustomerDashboard from "./pages/customer/customerDashboard";

function App() {
  return (
    <div className="h-screen w-screen">
      <LoginPage />
    </div>
  );
}

export default App;
