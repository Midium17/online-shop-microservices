import React, { useState } from 'react';
import api from '../../services/api';
import { Users, Search, Edit2, Trash2, Check, X, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

export default function CustomersTab({ customers, fetchData, setError, setSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });

  const handleStartEdit = (e, cust) => {
    e.stopPropagation();
    setEditingId(cust.id);
    setEditForm({
      first_name: cust.first_name && cust.first_name !== 'N/A' ? cust.first_name : '',
      last_name: cust.last_name && cust.last_name !== 'N/A' ? cust.last_name : '',
      email: cust.email || '',
      phone: cust.phone && cust.phone !== 'No phone provided' ? cust.phone : '',
      address: cust.address && cust.address !== 'N/A' ? cust.address : '',
      city: cust.city || '',
      country: cust.country || ''
    });
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleSaveEdit = async (e, customerId) => {
    e.stopPropagation();
    setError('');
    setSuccess('');
    
    // Debug log to confirm click and ID
    console.log("Saving customer ID:", customerId, "Payload:", editForm);

    try {
      const response = await api.put(`/auth/admin/customers/${customerId}`, editForm);
      console.log("Update success response:", response.data);
      setSuccess(`Customer #${customerId} profile updated successfully!`);
      setEditingId(null);
      if (fetchData) fetchData();
    } catch (err) {
      console.error("Update Customer Error Details:", err.response || err);
      setError(err.response?.data?.detail || 'Failed to update customer profile.');
    }
  };

  const handleDeleteCustomer = async (e, customerId) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete customer account #${customerId}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/auth/admin/customers/${customerId}`);
      setSuccess(`Customer #${customerId} deleted successfully.`);
      if (fetchData) fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete customer.');
    }
  };

  const toggleExpandCustomer = (customerId) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const filteredCustomers = customers.filter((c) => {
    const query = searchTerm.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const addressStr = `${c.address || ''} ${c.city || ''} ${c.country || ''}`.toLowerCase();
    return (
      c.email?.toLowerCase().includes(query) ||
      fullName.includes(query) ||
      addressStr.includes(query) ||
      c.id.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Complete Customer Information & Shipping Profiles
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage customer directory, view order activity, and edit shipping context.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">No registered customers found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs text-gray-400 uppercase">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact & Phone</th>
                  <th className="py-3 px-4">Shipping Address</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map((cust) => {
                  const isEditing = editingId === cust.id;
                  const isExpanded = expandedCustomerId === cust.id;
                  const fullName = cust.first_name && cust.first_name !== 'N/A' 
                    ? `${cust.first_name} ${cust.last_name || ''}`.trim() 
                    : 'Guest Account';

                  return (
                    <React.Fragment key={cust.id}>
                      <tr className="hover:bg-gray-50/50 transition">
                        {/* Customer Column */}
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {isEditing ? (
                            <div className="space-y-1.5 max-w-xs" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="First Name"
                                  value={editForm.first_name}
                                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                  className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Last Name"
                                  value={editForm.last_name}
                                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                  className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <input
                                type="email"
                                placeholder="Email Address"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center font-bold justify-center text-xs shrink-0">
                                {cust.email ? cust.email[0].toUpperCase() : 'C'}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{fullName}</p>
                                <p className="text-xs text-gray-400 font-normal">{cust.email}</p>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Phone Column */}
                        <td className="py-4 px-4 text-xs text-gray-600 font-medium" onClick={(e) => e.stopPropagation()}>
                          {isEditing ? (
                            <input
                              type="text"
                              placeholder="Phone number"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          ) : (
                            cust.phone || 'No phone provided'
                          )}
                        </td>

                        {/* Shipping Address Column */}
                        <td className="py-4 px-4 text-xs text-gray-600" onClick={(e) => e.stopPropagation()}>
                          {isEditing ? (
                            <div className="space-y-1.5 max-w-xs">
                              <input
                                type="text"
                                placeholder="Street Address"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="City"
                                  value={editForm.city}
                                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                  className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Country"
                                  value={editForm.country}
                                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                  className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          ) : cust.address && cust.address !== 'N/A' ? (
                            <div>
                              <p>{cust.address}</p>
                              <p className="text-gray-400">{cust.city}, {cust.country}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No address on file</span>
                          )}
                        </td>

                        {/* Total Orders Dropdown Toggle */}
                        <td className="py-4 px-4 font-medium text-gray-700">
                          <button
                            onClick={() => toggleExpandCustomer(cust.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                          >
                            <span>{cust.orders?.length || cust.total_orders || 0} orders</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* Total Spent */}
                        <td className="py-4 px-4 font-bold text-emerald-700">
                          ${(cust.total_spent || 0).toFixed(2)}
                        </td>

                        {/* Actions */}
                       <td className="py-4 px-4 text-right">
  {isEditing ? (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button 
        type="button"
        onClick={(e) => handleSaveEdit(e, cust.id)} 
        className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-bold transition shadow-xs cursor-pointer" 
        title="Save Changes"
      >
        <Check className="w-4 h-4" />
      </button>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setEditingId(null); }} 
        className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer" 
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={(e) => handleStartEdit(e, cust)}
        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
        title="Edit Customer Profile"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => handleDeleteCustomer(e, cust.id)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
        title="Delete Account"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )}
</td>
                      </tr>

                      {/* Expandable Purchased Items & Order History Dropdown */}
                      {isExpanded && (
                        <tr className="bg-gray-50/80">
                          <td colSpan="6" className="p-4 sm:p-6">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3 shadow-2xs">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Purchased Items & Order Breakdown for {fullName}
                              </h4>
                              
                              {!cust.orders || cust.orders.length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-2">No specific order breakdown items recorded for this customer yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {cust.orders.map((order, orderIdx) => (
                                    <div key={order.id || orderIdx} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                                      <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                                        <span>Order #{order.id} — Status: <span className="text-emerald-700 font-bold">{order.status || 'Completed'}</span></span>
                                        <span className="text-emerald-800 font-bold">${(order.total_amount || order.total || 0).toFixed(2)}</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        {order.items?.map((item, itemIdx) => (
                                          <div key={itemIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 text-xs">
                                            {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 object-cover rounded-md" />}
                                            <div className="flex-1 truncate">
                                              <p className="font-bold text-gray-900 truncate">{item.title || item.product_title || 'Product'}</p>
                                              <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}