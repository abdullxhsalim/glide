import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleLabel = (role) => {
    if (role === 'hopper' || role === 'rider') return 'Hopper';
    if (role === 'driver') return 'Sharer';
    return role;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-[#1E293B]/90 backdrop-blur-md border-b border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight font-sans text-[#F8FAFC]">glide</span>
          </Link>
          
          <div className="hidden md:block">
            {!user && (
              <div className="ml-10 flex items-center space-x-8">
                <a href="/#how-it-works" className="text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium">How it Works</a>
                <a href="/#branding" className="text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium">Safety</a>
                <a href="/#fare-estimate" className="text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium">Fare Estimate</a>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/dash" 
                  className="flex items-center gap-2 text-gray-300 hover:text-[#10B981] transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                
                <div className="h-6 w-px bg-gray-700"></div>

                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{getRoleLabel(user.role)}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold shadow-lg shadow-[#10B981]/20 ring-2 ring-[#1E293B]">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-[#F8FAFC] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Log In
                </Link>
                <Link to="/signup" className="bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/40 transform hover:-translate-y-0.5">
                  Sign Up
                </Link>
              </>
            )}
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
            {!user && (
              <>
                <a href="/#how-it-works" onClick={() => setIsMenuOpen(false)} className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium text-gray-300">How it Works</a>
                <a href="/#branding" onClick={() => setIsMenuOpen(false)} className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium text-gray-300">Safety</a>
                <a href="/#fare-estimate" onClick={() => setIsMenuOpen(false)} className="hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium text-gray-300">Fare Estimate</a>
              </>
            )}
            
            {user ? (
              <>
                <div className="border-t border-gray-700 my-2 pt-2">
                  <div className="flex items-center px-3 py-2">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">{user.name}</div>
                      <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user.email}</div>
                    </div>
                  </div>
                  <Link 
                    to="/dash" 
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-2 text-gray-300 hover:text-white hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left text-gray-300 hover:text-white hover:bg-[#334155] block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-700 pt-4 pb-3">
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Log In
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#10B981] hover:text-[#059669] block px-3 py-2 rounded-md text-base font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
