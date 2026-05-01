"use client";

import { Product, Order, Page, User } from "./types";
import { loadProducts, saveProducts, loadOrders, saveOrders } from "./store";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Sales from "./components/Sales";
import Report from "./components/Report";
import { useState, useEffect } from "react";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [page, setPage] = useState<Page>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
    setOrders(loadOrders());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveProducts(products);
  }, [products, loaded]);

  useEffect(() => {
    if (loaded) saveOrders(orders);
  }, [orders, loaded]);

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

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1619' }}>
        <div className="glass p-8 w-full max-w-md bg-[#0e1619] text-center">
          <h1 className="text-3xl font-bold gradient-text mb-6">⚡ BIENVENUE SWEET HOME</h1>
          <p className="text-white/40 mb-6">Sign in to access your dashboard</p>
          <SignInButton mode="modal">
            <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Create user object from Clerk with role based on email
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const currentUser: User = {
    id: user?.id || "1",
    username: email,
    role: email === "bienvenuesweethome@gmail.com" ? "admin" : "worker"
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0e1619' }}>
      <Sidebar currentPage={page} onNavigate={setPage} currentUser={currentUser} onLogout={() => {}} />
      <main className="flex-1 ml-64 p-6 overflow-auto min-h-screen">
        {page === "dashboard" && <Dashboard products={products} orders={orders} onNavigate={setPage} />}
        {page === "inventory" && <Inventory products={products} setProducts={setProducts} currentUser={currentUser} />}
        {page === "sales" && <Sales orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} currentUser={currentUser} />}
        {page === "report" && <Report orders={orders} products={products} currentUser={currentUser} />}
      </main>
    </div>
  );
}
