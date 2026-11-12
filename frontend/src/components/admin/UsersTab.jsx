import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserPlus, Shield, Trash2, Edit2, Check, X, Lock } from 'lucide-react';

export default function UsersTab({ users, fetchData, setError, setSuccess }) {
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'inventory_manager' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  // Permission Management States
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [activeRolePerm, setActiveRolePerm] = useState('inventory_manager');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/auth/admin/permissions');
      setAllPermissions(res.data.permissions || []);
      setRolePermissions(res.data.role_permissions || {});
    } catch (err) {
      console.error("Failed to load permission registry:", err);
    }
  };

  const togglePermission = (perm) => {
    const current = rolePermissions[activeRolePerm] || [];
    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];

    setRolePermissions({
      ...rolePermissions,
      [activeRolePerm]: updated,
    });
  };

  const handleSavePermissions = async () => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/auth/admin/permissions/${activeRolePerm}`, {
        permissions: rolePermissions[activeRolePerm] || [],
      });
      setSuccess(`Permissions updated for role '${activeRolePerm}' successfully!`);
    } catch (err) {
      setError('Failed to update permissions.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/admin/users', newUser);
      setSuccess(`Created ${newUser.role} account for ${newUser.email}`);
      setNewUser({ email: '', password: '', role: 'inventory_manager' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/auth/admin/users/${userId}/role`, { role: selectedRole });
      setSuccess(`Updated role for user #${userId} to ${selectedRole}`);
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      setError('Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete user #${userId}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/auth/admin/users/${userId}`);
      setSuccess(`User #${userId} deleted successfully.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: ROLE PERMISSION ASSIGNMENT MATRIX */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" /> Role Permission Matrix
          </h2>
          <button
            onClick={handleSavePermissions}
            className="bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-purple-800 transition"
          >
            Save Permissions Matrix
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {['inventory_manager', 'order_manager', 'customer'].map((role) => (
            <button
              key={role}
              onClick={() => setActiveRolePerm(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                activeRolePerm === role
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {role.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Permission Checkboxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {allPermissions.map((perm) => {
            const isChecked = (rolePermissions[activeRolePerm] || []).includes(perm);
            return (
              <label
                key={perm}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                  isChecked
                    ? 'border-purple-300 bg-purple-50/50 font-semibold text-purple-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePermission(perm)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>{perm}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CREATE USER & USERS DIRECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" /> Create System Account
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="staff@shop.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="admin">Admin (Full Access)</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="order_manager">Order Manager</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A382B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Users & Roles Directory Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">System Users & Active Roles ({users.length})</h2>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs text-gray-400 uppercase">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-4 font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center font-bold justify-center text-xs shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{u.email}</p>
                          <p className="text-[10px] text-gray-400">ID: #{u.id}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {editingUserId === u.id ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          >
                            <option value="admin">admin</option>
                            <option value="inventory_manager">inventory_manager</option>
                            <option value="order_manager">order_manager</option>
                            <option value="customer">customer</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'inventory_manager' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'order_manager' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {editingUserId === u.id ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleUpdateRole(u.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingUserId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => { setEditingUserId(u.id); setSelectedRole(u.role); }}
                              className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}