import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { User, Package, Truck, CheckCircle2, Clock, XCircle, ShoppingBag, Edit3, Save, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Account({ addToCart }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/orders/my-orders'),
      ]);
      setUser(userRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.items || []);
      
      setFormData({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        phone: userRes.data.phone || '',
        address: userRes.data.address || '',
        city: userRes.data.city || '',
        postal_code: userRes.data.postal_code || '',
        country: userRes.data.country || '',
      });
    } catch (err) {
      setError('Failed to load account information. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.patch('/auth/me', formData);
      setUser(res.data);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to cancel order.");
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleReorder = (order) => {
    if (!addToCart) {
      alert("Reorder function not passed to Account component.");
      return;
    }
    
    order.items.forEach(item => {
      const cartItem = {
        id: item.product_id,
        title: item.title || item.product_title || `Product #${item.product_id}`,
        price: item.price,
        image_url: item.image_url,
        quantity: item.quantity
      };
      addToCart(cartItem);
    });

    setSuccessMsg(`Items from Order #${order.id} added to your cart!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusStep = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('complete')) return 3;
    if (s.includes('process') || s.includes('ship') || s.includes('dispatch')) return 2;
    return 1;
  };

  // Add handler inside Account component
  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob', // Important for handling binary PDF data
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice_order_${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download invoice.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Pagination calculations
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 text-sm font-medium">Loading your profile...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">{successMsg}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Profile Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-2xl">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.first_name && user.first_name !== 'N/A' ? `Welcome back, ${user.first_name}!` : 'Welcome Back!'}
            </h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              📍 {user?.address ? `${user.address}, ${user.city || ''}, ${user.country || ''}` : 'No shipping address saved yet.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Edit Your Account & Shipping Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs">
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </form>
      )}

      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-600" /> My Orders & Live Tracking ({orders.length})
      </h2>

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 text-lg mb-1">No Orders Placed Yet</h3>
          <p className="text-gray-500 text-sm mb-6">Start shopping to place your first order!</p>
          <Link to="/" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-2xs">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {currentOrders.map((order) => {
            const step = getStatusStep(order.status);
            const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
            const isPending = (order.status || '').toLowerCase() === 'pending';

            return (
              <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
                
                {/* Order Summary Line */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isCancelled ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Shipping to: {order.address || 'N/A'}, {order.city || ''}, {order.country || ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-xl transition shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reorder
                    </button>

                    {isPending && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-3 py-1.5 rounded-xl transition shadow-2xs"
                      >
                        Cancel Order
                      </button>
                      
                    )}

                  
                      <button
                       onClick={() => handleDownloadInvoice(order.id)}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-3 py-1.5 rounded-xl transition shadow-2xs"
                     >
                  📥 Invoice
                     </button>



                    <div className="text-right pl-2 border-l border-gray-200">
                      <span className="text-gray-400 text-xs block">Total Amount</span>
                      <span className="text-indigo-600 font-extrabold text-lg">${(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Tracking Bar */}
                {!isCancelled ? (
                  <div className="py-2">
                    <div className="relative flex items-center justify-between max-w-xl mx-auto">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -z-0 transform -translate-y-1/2"></div>
                      <div
                        className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-0 transform -translate-y-1/2 transition-all duration-500"
                        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                      ></div>

                      <div className="flex flex-col items-center bg-white z-10 px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">Order Placed</span>
                      </div>

                      <div className="flex flex-col items-center bg-white z-10 px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">Processing</span>
                      </div>

                      <div className="flex flex-col items-center bg-white z-10 px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">Delivered</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2 border border-red-100">
                    <XCircle className="w-5 h-5 text-red-600" /> Order Cancelled
                  </div>
                )}

                {/* Items List (Showing Product Name & Product ID) */}
                <div className="bg-gray-50/70 p-4 rounded-xl space-y-3 text-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Order Items</h4>
                  <div className="divide-y divide-gray-200/50">
                    {order.items?.map((item, index) => (
                      <div key={index} className="py-2.5 flex justify-between items-center text-gray-800 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />}
                          <div>
                            <p className="font-medium text-gray-900 text-xs">
                              {item.title || item.product_title || `Product`} <span className="text-gray-400 text-[11px] font-normal">(ID: #{item.product_id})</span>
                            </p>
                            <p className="text-[11px] text-gray-500">Qty: {item.quantity} × ${(item.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 text-xs">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-2xs">
              <span className="text-xs text-gray-500">
                Showing <span className="font-semibold">{indexOfFirstOrder + 1}</span> to <span className="font-semibold">{Math.min(indexOfLastOrder, orders.length)}</span> of <span className="font-semibold">{orders.length}</span> orders
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs font-semibold text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}