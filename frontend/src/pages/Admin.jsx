import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { hasPermission } from '../utils/permissions';
import DashboardTab from '../components/admin/DashboardTab';
import ProductsTab from '../components/admin/ProductsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import OrdersTab from '../components/admin/OrdersTab';
import CustomersTab from '../components/admin/CustomersTab';
import AdminCsvManager from '../components/admin/AdminCsvManager';
import UsersTab from '../components/admin/UsersTab';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Shield,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Mail
} from 'lucide-react';


export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Backend Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);

  // Product Form & CRUD States
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    image_urls: [],
    category_id: '',
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Category Form State
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  // Status Filter States
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('user_role') || 'customer';


const safeHasPermission = (role, permission) => {
    if (!role) return false;
    if (typeof hasPermission === 'function') {
      try {
        return hasPermission(role, permission);
      } catch (e) {
        return false;
      }
    }
    // Fallback basic check if custom helper isn't imported
    return role === 'admin' || role === 'manager';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const currentRole = userRole || 'admin';

      const [prodRes, catRes, ordRes, custRes, userRes] = await Promise.all([
        safeHasPermission(currentRole, 'inventory:read')
          ? api.get('/products/').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),

        safeHasPermission(currentRole, 'category:manage') || safeHasPermission(currentRole, 'inventory:read')
          ? api.get('/categories/').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),

        safeHasPermission(currentRole, 'orders:read')
          ? api.get('/orders/').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),

        safeHasPermission(currentRole, 'customers:read')
          ? api.get('/auth/admin/customers/').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),

        currentRole === 'admin'
          ? api.get('/auth/admin/users/').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.items || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.items || []);
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : ordRes.data?.items || []);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.items || []);
      setUsers(Array.isArray(userRes.data) ? userRes.data : userRes.data?.items || []);

      setError('');
    } catch (err) {
      console.error("Fetch Data Error:", err);
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 font-semibold text-sm">
        Loading Admin Dashboard...
      </div>
    );
  }

  // Metrics Calculations
  const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const netSales = totalSales * 0.92;
  const totalVariants = products.length;

  // Multi-Image Upload Handler
  const handleImageFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    setUploading(true);
    setError('');
    try {
      const res = await api.post('/products/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setNewProduct((prev) => ({
        ...prev,
        image_url: res.data.image_url || '',
        image_urls: res.data.image_urls || [],
      }));
    } catch (err) {
      setError('Failed to upload images.');
    } finally {
      setUploading(false);
    }
  };

  // Product CRUD Handlers
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (uploading) return setError('Please wait for image upload to complete.');
    setError('');
    setSuccess('');

    try {
      await api.post('/products/', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category_id: newProduct.category_id ? parseInt(newProduct.category_id) : null,
      });
      setSuccess('Product created successfully!');
      resetProductForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product.');
    }
  };

  const handleStartEdit = (product) => {
    setEditingProductId(product.id);
    setNewProduct({
      title: product.title,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
      image_urls: product.image_urls || [],
      category_id: product.category_id || '',
    });
    setImagePreviews(product.image_urls?.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : []);
  };

  const handleCancelEdit = () => {
    resetProductForm();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProduct({ title: '', description: '', price: '', stock: '', image_url: '', image_urls: [], category_id: '' });
    setImagePreviews([]);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/products/${editingProductId}`, {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category_id: newProduct.category_id ? parseInt(newProduct.category_id) : null,
      });
      setSuccess(`Product #${editingProductId} updated successfully!`);
      resetProductForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  // Category Handlers

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/categories/', newCategory);
      setSuccess('Category created successfully!');
      setNewCategory({ name: '', description: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create category.');
    }
  };

  // Update Category
  const handleUpdateCategory = async (categoryId) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/categories/${categoryId}`, {
        name: newCategory.name,
        description: newCategory.description
      });
      setSuccess(`Category #${categoryId} updated successfully!`);
      setNewCategory({ name: '', description: '' });
      setEditingCategoryId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update category.');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (categoryId) => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/categories/${categoryId}`);
      setSuccess('Category deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete category. Ensure no products are attached to it.');
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setSuccess(`Order #${orderId} updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      setError('Failed to update order status.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab = orderFilter === 'ALL' || order.status.toUpperCase() === orderFilter.toUpperCase();
    const query = orderSearch.toLowerCase();
    const matchesSearch =
      order.customer_email?.toLowerCase().includes(query) ||
      order.first_name?.toLowerCase().includes(query) ||
      order.last_name?.toLowerCase().includes(query) ||
      order.id.toString().includes(query);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      
      {/* LEFT SIDEBAR MENU */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-6 shrink-0">
        <div>
          <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">MENU ({userRole})</p>

          <nav className="space-y-1">
            {hasPermission(userRole, 'analytics:read') && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
            )}

            {hasPermission(userRole, 'orders:read') && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'orders' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" /> Orders
                </div>
                <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{orders.length}</span>
              </button>
            )}

            {hasPermission(userRole, 'inventory:read') && (
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'products' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4" /> Products
              </button>
            )}

            {(hasPermission(userRole, 'category:manage') || hasPermission(userRole, 'inventory:read')) && (
              <button
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'categories' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FolderTree className="w-4 h-4" /> Category
              </button>
            )}

            {hasPermission(userRole, 'inventory:read') && (
              <button
                onClick={() => setActiveTab('csv')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'csv' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV Manager
              </button>
            )}

            {hasPermission(userRole, 'customers:read') && (
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'customers' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" /> Customers
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{customers.length}</span>
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === 'users' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4" /> Users & Roles
                </div>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{users.length}</span>
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-1 pt-6 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium">
            <HelpCircle className="w-4 h-4" /> Get Help
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">Hi, {userRole.replace('_', ' ')}</h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-64 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <Mail className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <Bell className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                {userRole.substring(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight capitalize">{userRole.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">Authenticated Staff</p>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl mb-6 text-sm">{success}</div>}

        {/* TAB 1: DASHBOARD ANALYTICS */}
        {activeTab === 'dashboard' && hasPermission(userRole, 'analytics:read') && (
          <DashboardTab
            totalSales={totalSales}
            totalOrders={totalOrders}
            netSales={netSales}
            totalVariants={totalVariants}
            products={products}
            fetchData={fetchData}
            setActiveTab={setActiveTab}
            userRole={userRole}
            hasPermission={hasPermission}
          />
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && hasPermission(userRole, 'inventory:read') && (
          <ProductsTab
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            categories={categories}
            editingProductId={editingProductId}
            imagePreviews={imagePreviews}
            uploading={uploading}
            handleImageFilesChange={handleImageFilesChange}
            handleCreateProduct={handleCreateProduct}
            handleUpdateProduct={handleUpdateProduct}
            handleStartEdit={handleStartEdit}
            handleCancelEdit={handleCancelEdit}
            handleDeleteProduct={handleDeleteProduct}
            products={products}
            userRole={userRole}
            hasPermission={hasPermission}
          />
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
       {activeTab === 'categories' && (hasPermission(userRole, 'category:manage') || hasPermission(userRole, 'inventory:read')) && (
          <CategoriesTab
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            handleCreateCategory={handleCreateCategory}
            handleUpdateCategory={handleUpdateCategory}
            handleDeleteCategory={handleDeleteCategory}
            categories={categories}
            fetchData={fetchData}
          />
        )}

        {/* TAB 4: CSV MANAGER */}
        {activeTab === 'csv' && hasPermission(userRole, 'inventory:read') && (
          <AdminCsvManager />
        )}

        {/* TAB 5: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && hasPermission(userRole, 'orders:read') && (
          <OrdersTab
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            filteredOrders={filteredOrders}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
            userRole={userRole}
            hasPermission={hasPermission}
          />
        )}

        {/* TAB 6: CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && hasPermission(userRole, 'customers:read') && (
          <CustomersTab 
          customers={customers} 
          fetchData={fetchData} 
          setError={setError} 
          setSuccess={setSuccess} />
        )}

        {/* TAB 7: USERS & ROLES MANAGEMENT */}
        {activeTab === 'users' && userRole === 'admin' && (
          <UsersTab
            users={users}
            fetchData={fetchData}
            setError={setError}
            setSuccess={setSuccess}
          />
        )}

      </main>
    </div>
  );
}