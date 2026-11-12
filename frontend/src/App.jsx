import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import Navbar from './components/Navbar';
import Storefront from './pages/Storefront';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Register from './pages/Register';
import Account from './pages/Account';
import ProtectedRoute from './components/ProtectedRoute';

// Error Boundary Component to prevent blank screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center max-w-lg mx-auto my-12 bg-red-50 rounded-2xl border border-red-100 shadow-sm font-sans">
          <h2 className="text-lg font-bold text-red-700">Something went wrong</h2>
          <p className="text-xs text-red-600 mt-2 font-mono bg-red-100/50 p-3 rounded-xl overflow-x-auto text-left">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Shopping Cart Persistence
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('ecommerce_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Authentication & User Profile State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [user, setUser] = useState(null);

  // Sync Cart to localStorage
  useEffect(() => {
    localStorage.setItem('ecommerce_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch Logged-in User Profile on Mount or Token Change
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          const role = res.data.role || (res.data.is_admin ? 'admin' : 'customer');
          localStorage.setItem('user_role', role);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user_role');
          setIsAuthenticated(false);
          setUser(null);
        });
    } else {
      setUser(null);
      localStorage.removeItem('user_role');
    }
  }, [isAuthenticated]);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Cart Operation Handlers
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <Navbar
          cartCount={totalCartCount}
          isAuthenticated={isAuthenticated}
          user={user}
          handleLogout={handleLogout}
        />
        <ErrorBoundary>
          <Routes>
            {/* Public Storefront & Cart */}
            <Route path="/" element={<Storefront addToCart={addToCart} />} />
            <Route
              path="/cart"
              element={
                <Cart
                  cart={cart}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                />
              }
            />

            {/* Checkout & Customer Account Routes */}
            <Route
              path="/checkout"
              element={<Checkout cart={cart} clearCart={clearCart} isAuthenticated={isAuthenticated} user={user} />}
            />
            <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route
              path="/account"
              element={isAuthenticated ? <Account addToCart={addToCart}/> : <Navigate to="/login" replace />}
            />

            {/* Protected Admin/Manager Route using ProtectedRoute wrapper */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'inventory_manager', 'order_manager']} />}>
              <Route path="/admin" element={<Admin userRole={user?.role || localStorage.getItem('user_role') || 'admin'} />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}