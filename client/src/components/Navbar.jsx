import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-[#1E293B]/90 backdrop-blur-md border-b border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight font-sans text-[#F8FAFC]">glide</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium">How it Works</a>
              <a href="#branding" className="text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium">Safety</a>
              <a href="#fare-estimate" className="text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium">Fare Estimate</a>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-[#4F46E5]/20 hover:shadow-[#4F46E5]/40 transform hover:-translate-y-0.5">
              Log In
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#F8FAFC] hover:bg-[#334155] focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1E293B] border-b border-[#334155]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#how-it-works" className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium">How it Works</a>
            <a href="#branding" className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium">Safety</a>
            <a href="#fare-estimate" className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium">Fare Estimate</a>
            <a href="#login" className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium text-[#10B981]">Log In</a>
            <button className="w-full text-center bg-[#4F46E5] text-white block px-3 py-3 rounded-lg text-base font-medium mt-4">
              Log In
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
