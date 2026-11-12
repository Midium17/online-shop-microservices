import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, RefreshCw, ChevronDown, Plus } from 'lucide-react';

export default function DashboardTab({ totalSales, totalOrders, netSales, totalVariants, products, fetchData, setActiveTab, userRole, hasPermission }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Total Sales</p>
            <h3 className="text-2xl font-black text-gray-900">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
              <TrendingUp className="w-3 h-3" /> +12.5% from last week
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Total Order</p>
            <h3 className="text-2xl font-black text-gray-900">{totalOrders.toLocaleString()}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
              <TrendingUp className="w-3 h-3" /> +1.0% from last week
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Net Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Net Sales</p>
            <h3 className="text-2xl font-black text-gray-900">${netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
              <TrendingUp className="w-3 h-3" /> +1.0% from last week
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Variant Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Total Variant</p>
            <h3 className="text-2xl font-black text-gray-900">{totalVariants}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 mt-2">
              <TrendingDown className="w-3 h-3" /> -2.5% from last week
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>


       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-gray-900">Total Order Overview</h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    Last update: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <RefreshCw className="w-3 h-3 text-gray-400 cursor-pointer" onClick={fetchData} />
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="bg-[#1A382B] text-white p-5 rounded-2xl space-y-2">
                    <p className="text-xs text-emerald-200">Total orders</p>
                    <h3 className="text-3xl font-black">{totalOrders}</h3>
                    <p className="text-[10px] text-emerald-300">Live store order count</p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span className="font-semibold text-gray-700">Statistics</span>
                      <span className="border px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1">All time <ChevronDown className="w-3 h-3" /></span>
                    </div>

                    <div className="h-36 w-full flex items-end pt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100">
                        <path
                          d="M 0,70 L 50,70 L 100,85 L 150,50 L 200,60 L 250,20 L 300,20"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3"
                        />
                        <circle cx="150" cy="50" r="5" fill="#10B981" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-gray-900">Stock Unit</h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1 border px-2 py-0.5 rounded-lg">Month <ChevronDown className="w-3 h-3" /></span>
                </div>

                <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="4"
                      strokeDasharray="50, 100"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-bold text-gray-900">100%</span>
                    <p className="text-[9px] text-gray-400">Inventory</p>
                  </div>
                </div>
              </div>
            </div>








      {/* Most Selling Products */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Most Selling Products</h2>
          {hasPermission(userRole, 'inventory:create') && (
            <button onClick={() => setActiveTab('products')} className="bg-[#1A382B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition">
              <Plus className="w-4 h-4" /> Add products
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
              <div className="aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                <img src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 truncate">{product.title}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-extrabold text-amber-600">${product.price.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400">{product.stock} left</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}