"use client";

import { Order, Product, User } from "../types";
import { useState } from "react";

export default function Report({ orders, products, currentUser }: { orders: Order[]; products: Product[]; currentUser: User }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  function handlePrint() {
    window.print();
  }

  // Add print styles dynamically
  if (typeof window !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        aside, .no-print { display: none !important; }
        main { margin-left: 0 !important; padding: 20px !important; }
        .glass { background: white !important; border: 1px solid #ddd !important; color: black !important; }
        .neon-glow-purple, .neon-glow-green, .neon-glow-cyan, .neon-glow-pink { box-shadow: none !important; }
        .gradient-text { background: none !important; -webkit-text-fill-color: black !important; }
        body { background: white !important; }
        .text-white\\/40, .text-white\\/30, .text-white\\/20, .text-white\\/50, .text-white\\/60, .text-white\\/70, .text-white\\/80 { color: #333 !important; }
        .text-neon-purple, .text-neon-green, .text-neon-cyan, .text-neon-pink { color: #000 !important; }
        .bg-white\\/5 { background: #f5f5f5 !important; }
        .border-white\\/5, .border-white\\/10 { border-color: #ddd !important; }
        button { display: none !important; }
        .print-header { display: block !important; text-align: center; margin-bottom: 30px; }
        .print-header img { max-width: 150px; height: auto; filter: brightness(0); }
        .print-header h1 { font-size: 24px; font-weight: bold; margin: 10px 0; }
      }
      @media screen {
        .print-header { display: none !important; }
      }
    `;
    if (!document.head.querySelector('style[data-print-styles]')) {
      style.setAttribute('data-print-styles', 'true');
      document.head.appendChild(style);
    }
  }

  const filteredOrders = orders.filter(order => order.date === selectedDate);
  const salesCount = filteredOrders.length;
  const totalRevenue = filteredOrders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
  const cancelledCount = filteredOrders.filter(o => o.status === "cancelled").length;

  // Group orders by status
  const statusBreakdown = {
    pending: filteredOrders.filter(o => o.status === "pending").length,
    confirmed: filteredOrders.filter(o => o.status === "confirmed").length,
    shipped: filteredOrders.filter(o => o.status === "shipped").length,
    delivered: filteredOrders.filter(o => o.status === "delivered").length,
    cancelled: filteredOrders.filter(o => o.status === "cancelled").length,
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="print-header">
        <img src="/logo.png" alt="Logo" />
        <h1>BIENVENUE SWEET HOME</h1>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Report</h1>
          <p className="text-white/40 text-sm mt-1">Daily sales and stock reports</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/60">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
          />
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            🖨️ Print PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 text-center neon-glow-purple">
          <div className="text-2xl font-bold text-neon-purple">{salesCount}</div>
          <div className="text-xs text-white/40 mt-1">Total Orders</div>
        </div>
        <div className="glass p-4 text-center neon-glow-green">
          <div className="text-2xl font-bold text-neon-green">Ar {totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-white/40 mt-1">Revenue</div>
        </div>
        <div className="glass p-4 text-center neon-glow-cyan">
          <div className="text-2xl font-bold text-neon-cyan">{salesCount - cancelledCount}</div>
          <div className="text-xs text-white/40 mt-1">Completed</div>
        </div>
        <div className="glass p-4 text-center neon-glow-pink">
          <div className="text-2xl font-bold text-neon-pink">{cancelledCount}</div>
          <div className="text-xs text-white/40 mt-1">Cancelled</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-white/80 mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white/40">{statusBreakdown.pending}</div>
            <div className="text-xs text-white/30 mt-1">Pending</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-neon-cyan">{statusBreakdown.confirmed}</div>
            <div className="text-xs text-white/30 mt-1">Confirmed</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-neon-purple">{statusBreakdown.shipped}</div>
            <div className="text-xs text-white/30 mt-1">Shipped</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-neon-green">{statusBreakdown.delivered}</div>
            <div className="text-xs text-white/30 mt-1">Delivered</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-neon-pink">{statusBreakdown.cancelled}</div>
            <div className="text-xs text-white/30 mt-1">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-white/80 mb-4">Orders for {selectedDate}</h2>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-white/30">No orders found for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/5">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-neon-cyan font-mono text-xs">{order.id}</td>
                    <td className="py-3 px-4 text-white/70">{order.customer}</td>
                    <td className="py-3 px-4 text-white/50">{order.items.length} items</td>
                    <td className="py-3 px-4 text-right text-neon-green font-medium">Ar {order.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge-${order.status} px-2 py-0.5 rounded-full text-xs capitalize`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Arrivals Note */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-white/80 mb-4">Stock Arrivals</h2>
        <div className="text-white/50 text-sm">
          <p>Stock arrivals are tracked through the "Add Stock" feature in Inventory.</p>
          <p className="mt-2">To view stock arrival history, check the Inventory page for quantity changes over time.</p>
        </div>
      </div>
    </div>
  );
}
