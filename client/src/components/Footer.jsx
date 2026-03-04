import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] py-10 border-t border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Logo & Tagline */}
        <div className="mb-4 text-center">
          <span className="font-bold text-3xl tracking-tight font-sans text-[#F8FAFC]">glide</span>
          <p className="text-[#64748B] mt-1 text-sm uppercase tracking-wider font-semibold">
            University Course Project
          </p>
        </div>

        {/* Developer Credits */}
        <div className="text-center mb-4">
           <p className="text-gray-600 text-xs uppercase tracking-[0.2em] transition-colors duration-300 hover:text-white cursor-default">
             Developed by Abdullah Salim, Sadia Afrin Misha & Shahran Hossain
           </p>
        </div>

        {/* Bottom Links & Copy */}
        <div className="text-center space-y-2">
           <p className="text-[#475569] text-xs pt-2">
             &copy; 2026 glide
           </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
