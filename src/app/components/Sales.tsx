"use client";

import { Product, Order, User, OrderItem } from "../types";
import { updateOrder, deleteOrder as deleteOrderFromFirestore, saveOrder, updateProduct } from "../firestoreStore";
import { useState, useEffect, useRef } from "react";

export default function Sales({ orders, setOrders, products, setProducts, currentUser }: { orders: Order[]; setOrders: (o: Order[]) => void; products: Product[]; setProducts: (p: Product[]) => void; currentUser: User }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  async function handleStatusChange(orderId: string, newStatus: Order["status"]) {
    await updateOrder(orderId, { status: newStatus });
  }

  async function handleDeleteOrder(orderId: string) {
    if (confirm("Are you sure you want to delete this order? Stock will be restored.")) {
      const orderToDelete = orders.find(o => o.id === orderId);
      if (orderToDelete) {
        // Restore stock
        const updatedProducts = [...products];
        orderToDelete.items.forEach(item => {
          const idx = updatedProducts.findIndex(p => p.id === item.productId);
          if (idx >= 0) {
            updatedProducts[idx] = { ...updatedProducts[idx], quantity: updatedProducts[idx].quantity + item.quantity };
            updateProduct(updatedProducts[idx].id, { quantity: updatedProducts[idx].quantity });
          }
        });
      }
      await deleteOrderFromFirestore(orderId);
    }
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  function printReceipt(order: Order) {
    try {
      const printWindow = window.open('', '', 'width=400,height=600');
      if (!printWindow) {
        alert('Please allow popups to print receipts');
        return;
      }

      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 4px 0;">${item.productName}</td>
          <td style="padding: 4px 0; text-align: right;">${item.quantity}x</td>
          <td style="padding: 4px 0; text-align: right;">Ar ${item.total.toFixed(2)}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt #${order.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; margin: 0; }
            h1 { text-align: center; margin: 0 0 20px 0; }
            .logo { text-align: center; margin-bottom: 20px; }
            .logo img { max-width: 150px; height: auto; filter: brightness(0); }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { border-bottom: 1px dashed #000; padding: 8px 0; text-align: left; }
            td { padding: 4px 0; }
            .total { border-top: 1px dashed #000; margin-top: 20px; padding-top: 10px; }
            .row { display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1>BIENVENUE SWEET HOME</h1>
          <div class="info">
            <div><strong>Receipt #${order.id}</strong></div>
            <div>Date: ${order.date}</div>
            <div>Customer: ${order.customer}</div>
            ${order.phone ? `<div>Phone: ${order.phone}</div>` : ''}
            ${order.address ? `<div>Address: ${order.address}</div>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <div class="row"><span>Subtotal:</span><span>Ar ${order.subtotal.toFixed(2)}</span></div>
            <div class="row"><span>Delivery:</span><span>Ar ${(order.deliveryCost || 0).toFixed(2)}</span></div>
            <div class="row" style="font-size: 18px; font-weight: bold; margin-top: 10px;"><span>TOTAL:</span><span>Ar ${order.total.toFixed(2)}</span></div>
          </div>
          <div class="footer">
            misaotra nanjifa
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Print error:', error);
      alert('Error printing receipt. Please try again.');
    }
  }

  async function handleCreateOrder(order: Omit<Order, "id">) {
    const newOrder = { ...order, id: `ORD-${Date.now()}` };
    await saveOrder(newOrder as Order);

    // Deduct stock
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newQuantity = Math.max(0, product.quantity - item.quantity);
        updateProduct(product.id, { quantity: newQuantity });
      }
    });
    setShowForm(false);
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Sales</h1>
          <p className="text-white/40 text-sm mt-1">Track and manage your orders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer neon-glow-pink"
        >
          + New Order
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              statusFilter === status
                ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-cyan">{filtered.length}</div>
          <div className="text-xs text-white/40">Orders</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">Ar {totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-white/40">Revenue</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-purple">
            Ar {filtered.length > 0 ? (totalRevenue / filtered.filter(o => o.status !== "cancelled").length).toFixed(2) : "0.00"}
          </div>
          <div className="text-xs text-white/40">Avg Order</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by order ID or customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Orders Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs border-b border-white/5">
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-right py-3 px-4">Subtotal</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-neon-cyan font-mono text-xs">{order.id}</td>
                  <td className="py-3 px-4 text-white/70">{order.customer}</td>
                  <td className="py-3 px-4 text-white/50">{order.items.length} items</td>
                  <td className="py-3 px-4 text-right text-white/50">Ar {order.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-neon-green font-medium">Ar {order.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                      className={`badge-${order.status} px-2 py-0.5 rounded-full text-xs capitalize !p-1 !border-0`}
                    >
                      {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-white/40 text-xs">{order.date}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewOrder(order)} className="text-white/40 hover:text-neon-cyan transition-colors cursor-pointer text-xs">👁️</button>
                      <button onClick={() => printReceipt(order)} className="text-white/40 hover:text-neon-green transition-colors cursor-pointer text-xs">🖨️</button>
                      {currentUser.role === "admin" && (
                        <button onClick={() => handleDeleteOrder(order.id)} className="text-white/40 hover:text-neon-pink transition-colors cursor-pointer text-xs">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30">No orders found</div>
        )}
      </div>

      {/* Create Order Modal */}
      {showForm && (
        <CreateOrderForm
          products={products}
          onSave={handleCreateOrder}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <OrderDetail order={viewOrder} onClose={() => setViewOrder(null)} onPrint={() => printReceipt(viewOrder)} onDelete={() => handleDeleteOrder(viewOrder.id)} currentUser={currentUser} />
      )}
    </div>
  );
}

function CreateOrderForm({ products, onSave, onClose }: { products: Product[]; onSave: (o: Omit<Order, "id">) => void; onClose: () => void }) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(p =>
    p.quantity > 0 && (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    )
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addItem() {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.productId === product.id
        ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.price }
        : i
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.price,
        total: qty * product.price,
      }]);
    }
    setSelectedProduct("");
    setProductSearch("");
    setShowProductDropdown(false);
    setQty(1);
  }

  function removeItem(productId: string) {
    setItems(items.filter(i => i.productId !== productId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || items.length === 0) return;
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const total = subtotal + deliveryCost;
    onSave({
      customer,
      phone,
      address,
      items,
      subtotal,
      deliveryCost,
      total,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const total = subtotal + deliveryCost;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-2xl neon-glow-pink max-h-[90vh] overflow-y-auto bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold gradient-text mb-6">New Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Customer Name</label>
            <input type="text" required value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Phone Number (Optional)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Address (Optional)</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" />
          </div>

          {/* Add items */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Add Items</label>
            <div className="flex gap-2">
              <div className="flex-1 relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search product name or SKU..."
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedProduct(p.id); setProductSearch(p.name); setShowProductDropdown(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-white/70 hover:bg-white/5 cursor-pointer"
                      >
                        {p.name} (Ar {p.price}) — {p.quantity} in stock
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} className="w-20" />
              <button type="button" onClick={addItem} className="px-4 py-2 rounded-xl bg-neon-purple/20 text-neon-purple text-sm hover:bg-neon-purple/30 transition-colors cursor-pointer">
                Add
              </button>
            </div>
          </div>

          {/* Item list */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div>
                    <div className="text-sm text-white/70">{item.productName}</div>
                    <div className="text-xs text-white/30">{item.quantity} × Ar {item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neon-green">Ar {item.total.toFixed(2)}</span>
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-white/30 hover:text-neon-pink transition-colors cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/5 pt-2 space-y-1">
                <div className="flex justify-between text-sm text-white/50">
                  <span>Subtotal</span><span>Ar {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/50 items-center gap-2">
                  <span>Delivery Cost</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-neon-green">
                  <span>Total</span><span>Ar {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={items.length === 0 || !customer} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
              Create Order
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetail({ order, onClose, onPrint, onDelete, currentUser }: { order: Order; onClose: () => void; onPrint: () => void; onDelete: () => void; currentUser: User }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-lg neon-glow-cyan bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">Order {order.id}</h2>
          <span className={`badge-${order.status} px-3 py-1 rounded-full text-xs capitalize`}>{order.status}</span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Customer</span>
            <span className="text-white/70">{order.customer}</span>
          </div>
          {order.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Phone</span>
              <span className="text-white/70">{order.phone}</span>
            </div>
          )}
          {order.address && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Address</span>
              <span className="text-white/70">{order.address}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Date</span>
            <span className="text-white/70">{order.date}</span>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h3 className="text-sm text-white/40 mb-3">Items</h3>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-white/5">
                <div>
                  <div className="text-sm text-white/70">{item.productName}</div>
                  <div className="text-xs text-white/30">{item.quantity} × Ar {item.price.toFixed(2)}</div>
                </div>
                <span className="text-sm text-neon-green">Ar {item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-white/50">
              <span>Subtotal</span><span>Ar {order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/50">
              <span>Delivery Cost</span><span>Ar {(order.deliveryCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-neon-green">
              <span>Total</span><span>Ar {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
            Close
          </button>
          {currentUser.role === "admin" && (
            <button onClick={onDelete} className="flex-1 py-2.5 rounded-xl bg-neon-red/20 border border-neon-red/30 text-neon-red font-medium text-sm hover:bg-neon-red/30 transition-colors cursor-pointer">
              🗑️ Delete
            </button>
          )}
          <button onClick={onPrint} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer">
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
