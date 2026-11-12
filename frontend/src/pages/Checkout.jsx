import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, MapPin, Phone, Mail, Package, Sparkles } from 'lucide-react';

export default function Checkout({ cart, clearCart, isAuthenticated, user }) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);
  const navigate = useNavigate();

  // Populate from user profile OR fallback to latest past order
  useEffect(() => {
    const loadCustomerDetails = async () => {
      try {
        let profile = user;

        // 1. Fetch fresh user profile if not passed in props
        if (!profile && isAuthenticated) {
          const res = await api.get('/auth/me');
          profile = res.data;
        }

        if (profile) {
          let updatedForm = {
            email: profile.email || '',
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            phone: profile.phone || '',
            address: profile.address || '',
            city: profile.city || '',
            postalCode: profile.postal_code || profile.postalCode || '',
            country: profile.country || '',
          };

          // 2. If address is still missing in profile, fetch latest order details
          if (!updatedForm.address || !updatedForm.phone) {
            try {
              const ordersRes = await api.get('/orders/my-orders');
              const pastOrders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.items || [];
              if (pastOrders.length > 0) {
                const latest = pastOrders[0];
                updatedForm.firstName = updatedForm.firstName || latest.first_name || '';
                updatedForm.lastName = updatedForm.lastName || latest.last_name || '';
                updatedForm.phone = updatedForm.phone || latest.phone || '';
                updatedForm.address = updatedForm.address || latest.address || '';
                updatedForm.city = updatedForm.city || latest.city || '';
                updatedForm.postalCode = updatedForm.postalCode || latest.postal_code || '';
                updatedForm.country = updatedForm.country || latest.country || '';
              }
            } catch (e) {
              console.warn("Could not fetch previous order address fallback:", e);
            }
          }

          setFormData(updatedForm);
          if (updatedForm.address || updatedForm.email) {
            setAutoFilled(true);
          }
        }
      } catch (err) {
        console.error("Error populating checkout customer info:", err);
      }
    };

    if (isAuthenticated) {
      loadCustomerDetails();
    }
  }, [user, isAuthenticated]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 10.00;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        customer_email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      const res = await api.post('/orders/', payload);
      setOrderSuccess(res.data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit order. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // ORDER CONFIRMED STATE
  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl border shadow-xs text-center space-y-6">
        <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h1>
          <p className="text-gray-600 text-sm">
            Thank you, <span className="font-semibold">{orderSuccess.first_name || orderSuccess.customer_email}</span>!
          </p>
          <p className="text-xs text-gray-500 mt-1">Order Reference ID: #{orderSuccess.id}</p>
        </div>

        <div className="bg-gray-50 py-3 px-4 rounded-xl inline-block border border-gray-100">
          <span className="text-sm text-gray-500 block">Total Amount Paid</span>
          <span className="text-emerald-700 font-bold text-2xl">${(orderSuccess.total_amount || total).toFixed(2)}</span>
        </div>

        {isAuthenticated ? (
          <div className="pt-2">
            <Link
              to="/account"
              className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition text-sm"
            >
              View Order in My Account
            </Link>
          </div>
        ) : (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <Package className="w-5 h-5 text-indigo-600" />
              <h3>Want to track your order live?</h3>
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Create an account using <strong className="text-indigo-950">{orderSuccess.customer_email}</strong> to access live delivery status updates and saved checkout details.
            </p>
            <Link
              to={`/register?email=${encodeURIComponent(orderSuccess.customer_email)}`}
              className="block text-center bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
            >
              Create Account & Track Order
            </Link>
          </div>
        )}

        <div>
          <Link to="/" className="inline-block text-gray-500 font-medium hover:text-emerald-600 transition text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      {autoFilled && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl mb-6 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Shipping details pre-filled from your saved account profile!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmitOrder} className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" /> Contact Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Shipping Address
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input type="text" required name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" required name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input type="text" required name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" required name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-700 transition shadow-xs"
          >
            {loading ? 'Processing Order...' : `Pay $${total.toFixed(2)} & Place Order`}
          </button>
        </form>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Summary ({cart.reduce((a, c) => a + c.quantity, 0)})</h2>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}