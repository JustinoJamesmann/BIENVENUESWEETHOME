"use client";

import { Product, Order, Page, User } from "./types";
import { loadProducts, saveProducts, loadOrders, saveOrders, login, logout, getCurrentUser } from "./store";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Sales from "./components/Sales";
import Report from "./components/Report";
import { useState, useEffect } from "react";

export default function Home() {
  const [page, setPage] = useState<Page>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
    setOrders(loadOrders());
    setCurrentUser(getCurrentUser());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveProducts(products);
  }, [products, loaded]);

  useEffect(() => {
    if (loaded) saveOrders(orders);
  }, [orders, loaded]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const user = login(loginUsername, loginPassword);
    if (user) {
      setCurrentUser(user);
      setLoginError("");
      setLoginUsername("");
      setLoginPassword("");
    } else {
      setLoginError("Invalid username or password");
    }
  }

  function handleLogout() {
    logout();
    setCurrentUser(null);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1619' }}>
        <div className="text-center">
          <div className="text-4xl font-bold gradient-text mb-2">⚡ BIENVENUE SWEET HOME</div>
          <div className="text-sm text-white/40 animate-pulse-neon">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1619' }}>
        <div className="glass p-8 w-full max-w-md bg-[#0e1619]">
          <h1 className="text-3xl font-bold gradient-text mb-6 text-center">⚡ BIENVENUE SWEET HOME</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="text-neon-red text-sm text-center">{loginError}</div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0e1619' }}>
      <Sidebar currentPage={page} onNavigate={setPage} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 ml-64 p-6 overflow-auto min-h-screen">
        {page === "dashboard" && <Dashboard products={products} orders={orders} onNavigate={setPage} />}
        {page === "inventory" && <Inventory products={products} setProducts={setProducts} currentUser={currentUser} />}
        {page === "sales" && <Sales orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} currentUser={currentUser} />}
        {page === "report" && <Report orders={orders} products={products} currentUser={currentUser} />}
      </main>
    </div>
  );
}
