import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1E293B] text-[#F8FAFC] font-sans selection:bg-[#10B981] selection:text-[#1E293B] relative overflow-hidden">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dash" element={<Dashboard />} />
        </Routes>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;