import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import { AuthProvider } from "./context/AuthContext";

function Layout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const showFooter = location.pathname !== "/dash" && !isAdminPath;

  return (
    <div className="min-h-screen bg-[#1E293B] text-[#F8FAFC] font-sans selection:bg-[#10B981] selection:text-[#1E293B] relative overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dash" element={<Dashboard />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/portal" element={<AdminPortal />} />
        </Routes>
      </div>
      {showFooter && (
        <div className="relative z-10">
          <Footer />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </Router>
  );
}

export default App;