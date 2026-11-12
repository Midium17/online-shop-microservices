import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Shield, LogOut } from 'lucide-react';
import { hasPermission } from '../utils/permissions';
import midOnlineIcon from '../assets/MidOnlineIcon.png';

export default function Navbar({ cartCount, isAuthenticated, user, handleLogout }) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role') || (user?.role) || 'customer';

  const canAccessAdmin = isAuthenticated && (
    user?.is_admin || 
    hasPermission(userRole, 'analytics:read') || 
    hasPermission(userRole, 'inventory:read') || 
    hasPermission(userRole, 'orders:read')
  );

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* Brand Logo Icon & Text Side-by-Side */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src={midOnlineIcon} alt="MidOnline Logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-extrabold tracking-tight text-gray-900">MidOnline</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition">
            Shopfront
          </Link>

          {/* Cart Icon & Badge */}
          <Link 
            to="/cart" 
            className="relative p-2 text-gray-600 hover:text-emerald-700 transition"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Admin / Control Center Link */}
          {canAccessAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition"
            >
              <Shield className="w-4 h-4" /> Control Center
            </Link>
          )}

          {/* User Account or Login Links */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/account" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-emerald-700 transition">
                <User className="w-4 h-4" /> Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 p-1 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-[#1A382B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-900 transition"
            >
              Sign In
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}