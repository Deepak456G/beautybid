import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowUpRight, ShieldCheck, User, LogOut, LayoutDashboard, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin, isBrand } = useAuth();

  const navLinks = [
    { name: 'Leaderboard', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'How It Works', path: '/how-it-works' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-cream-300/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-noir-900 text-gold-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-noir-900 leading-none group-hover:text-gold-600 transition-colors">
                BeautyBid
              </span>
              <span className="text-[10px] uppercase tracking-widest text-noir-600 font-semibold mt-0.5">
                Promotional Ranking
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                  isActive(link.path)
                    ? 'text-noir-900 font-semibold'
                    : 'text-noir-600 hover:text-noir-900'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-500 rounded-full animate-fadeIn" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/promote"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-noir-900 text-cream-50 hover:bg-noir-800 text-xs font-semibold uppercase tracking-wider shadow-sm hover:shadow-editorial-hover transition-all duration-200 border border-noir-700 group"
            >
              <span>Promote Your Product</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-cream-200/80 border border-cream-300 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gold-200 text-noir-900 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-cream-50 rounded-2xl shadow-editorial border border-cream-300 py-2 text-sm z-50 animate-fadeIn"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-cream-200">
                      <p className="font-semibold text-noir-900 truncate">{user.name}</p>
                      <p className="text-xs text-noir-600 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold-100 text-gold-700">
                        {user.role}
                      </span>
                    </div>

                    {isBrand && (
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-noir-700 hover:bg-cream-200/60 hover:text-noir-900"
                      >
                        <LayoutDashboard className="w-4 h-4 text-noir-600" />
                        <span>Brand Dashboard</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-noir-700 hover:bg-cream-200/60 hover:text-noir-900"
                      >
                        <Crown className="w-4 h-4 text-gold-600" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 text-left border-t border-cream-200 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold uppercase tracking-wider text-noir-700 hover:text-noir-900 px-3 py-2 rounded-lg hover:bg-cream-200/60 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/promote"
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-noir-900 text-cream-50 text-[11px] font-semibold uppercase tracking-wider"
            >
              Promote
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-noir-700 hover:bg-cream-200 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-cream-50 border-b border-cream-300 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-cream-200 text-noir-900 font-semibold'
                  : 'text-noir-700 hover:bg-cream-100'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 border-t border-cream-200 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="font-semibold text-noir-900">{user.name}</p>
                  <span className="text-xs text-gold-700 uppercase font-bold">{user.role}</span>
                </div>
                {isBrand && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-noir-800 hover:bg-cream-200"
                  >
                    Brand Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-noir-800 hover:bg-cream-200 font-semibold text-gold-700"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-xl border border-noir-800 text-noir-900 font-medium text-xs uppercase tracking-wider"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-xl bg-noir-900 text-cream-50 font-medium text-xs uppercase tracking-wider"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
