import React from 'react';
import { ShoppingBag, Search } from 'lucide-react';

export default function OrdersTab({
  orderFilter, setOrderFilter, orderSearch, setOrderSearch,
  filteredOrders, handleUpdateOrderStatus, userRole, hasPermission
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setOrderFilter(status)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${orderFilter === status ? 'bg-[#1A382B] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search orders..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 text-base">Order #{order.id}</h3>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{order.first_name} {order.last_name} ({order.customer_email})</p>
                </div>

                {hasPermission(userRole, 'orders:update_status') && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium mr-1">Status:</span>
                    <button onClick={() => handleUpdateOrderStatus(order.id, 'Pending')} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100">Pending</button>
                    <button onClick={() => handleUpdateOrderStatus(order.id, 'Processing')} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100">Processing</button>
                    <button onClick={() => handleUpdateOrderStatus(order.id, 'Completed')} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100">Complete</button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2">
                <span>Total Amount</span>
                <span className="text-emerald-700 text-base">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}