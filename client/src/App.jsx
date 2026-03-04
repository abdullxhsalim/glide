import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";

function App() {
  return (
    <div className="min-h-screen bg-[#1E293B] text-[#F8FAFC] font-sans selection:bg-[#10B981] selection:text-[#1E293B] relative overflow-hidden">
      <Navbar />
      <Home />
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default App;