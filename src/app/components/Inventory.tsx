"use client";

import { Product, User } from "../types";
import { loadCategories, addProduct, updateProduct, deleteProduct } from "../firestoreStore";
import { useState, useEffect } from "react";

export default function Inventory({ products, setProducts, currentUser }: { products: Product[]; setProducts: (p: Product[]) => void; currentUser: User }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);

  useEffect(() => {
    loadCategories().then(setCategories);
  }, []);

  const filterCategories = ["all", ...categories];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalValue = filtered.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalUnits = filtered.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = filtered.filter(p => p.quantity <= 10).length;

  async function handleSave(product: Omit<Product, "id"> & { id?: string }) {
    if (product.id) {
      await updateProduct(product.id, product as Product);
    } else {
      const newProduct = { ...product, id: Date.now().toString() } as Product;
      await addProduct(newProduct);
    }
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this product?")) {
      await deleteProduct(id);
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Inventory</h1>
          <p className="text-white/40 text-sm mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          {currentUser.role === "admin" && (
            <>
              <button
                onClick={() => setShowStockModal(true)}
                className="px-4 py-2.5 rounded-xl bg-neon-red/20 border border-neon-red/30 text-neon-red font-medium text-sm hover:bg-neon-red/30 transition-colors cursor-pointer"
              >
                📦 Add Stock
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium text-sm hover:bg-white/10 transition-colors cursor-pointer"
              >
                📁 Categories
              </button>
              <button
                onClick={() => { setEditingProduct(null); setShowForm(true); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer neon-glow-purple"
              >
                + Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-cyan">{filtered.length}</div>
          <div className="text-xs text-white/40">Products</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{totalUnits}</div>
          <div className="text-xs text-white/40">Total Units</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-purple">{lowStockCount}</div>
          <div className="text-xs text-white/40">Low Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search products or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40">
          {filterCategories.map(c => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs border-b border-white/5">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">SKU</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">Stock</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const isLow = product.quantity <= 10;
                return (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white/80 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-neon-cyan font-mono text-xs">{product.sku}</td>
                    <td className="py-3 px-4 text-white/50">{product.category}</td>
                    <td className="py-3 px-4 text-right text-white/70">Ar {product.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={isLow ? "text-neon-orange font-bold" : "text-white/70"}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Low</span>
                      ) : (
                        <span className="badge-delivered px-2 py-0.5 rounded-full text-xs">OK</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {currentUser.role === "admin" && (
                          <>
                            <button onClick={() => handleEdit(product)} className="text-white/40 hover:text-neon-cyan transition-colors cursor-pointer text-xs">✏️</button>
                            <button onClick={() => handleDelete(product.id)} className="text-white/40 hover:text-neon-pink transition-colors cursor-pointer text-xs">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30">No products found</div>
        )}
        <div className="px-4 py-3 border-t border-white/5 flex justify-between text-xs text-white/30">
          <span>{filtered.length} products</span>
          <span>Total value: <span className="text-neon-green">Ar {totalValue.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}
      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          setCategories={setCategories}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
      {/* Stock Arrival Modal */}
      {showStockModal && (
        <StockModal
          products={products}
          setProducts={setProducts}
          onClose={() => setShowStockModal(false)}
        />
      )}
    </div>
  );
}

function ProductForm({ product, categories, onSave, onClose }: { product: Product | null; categories: string[]; onSave: (p: Omit<Product, "id"> & { id?: string }) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || (categories[0] || ""),
    price: product?.price || 0,
    quantity: product?.quantity || 0,
  });
  const [showDropdown, setShowDropdown] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form, id: product?.id });
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-lg neon-glow-purple bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold gradient-text mb-6">{product ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Product Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">SKU</label>
            <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Price (Ar)</label>
            <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full" />
          </div>
          <div className="text-center relative">
            <label className="text-xs text-white/40 mb-1 block">Category</label>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-left hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{form.category}</span>
              <span className="text-white/40">{showDropdown ? "▲" : "▼"}</span>
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {categories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setForm({ ...form, category: c }); setShowDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                      form.category === c
                        ? "bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 text-neon-purple"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Quantity</label>
            <input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} className="w-full" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer">
              {product ? "Update" : "Create"} Product
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

function CategoryModal({ categories, setCategories, onClose }: { categories: string[]; setCategories: (c: string[]) => void; onClose: () => void }) {
  const [newCategory, setNewCategory] = useState("");

  function handleAdd() {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  }

  function handleDelete(category: string) {
    if (categories.length <= 1) return;
    setCategories(categories.filter(c => c !== category));
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-md neon-glow-cyan bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold gradient-text mb-6">Manage Categories</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-sm hover:bg-neon-cyan/30 transition-colors cursor-pointer">
            Add
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.map(c => (
            <div key={c} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
              <span className="text-white/70">{c}</span>
              {categories.length > 1 && (
                <button onClick={() => handleDelete(c)} className="text-white/30 hover:text-neon-pink transition-colors cursor-pointer text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}

function StockModal({ products, setProducts, onClose }: { products: Product[]; setProducts: (p: Product[]) => void; onClose: () => void }) {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  function handleAddStock() {
    if (!selectedProductId || quantityToAdd <= 0) return;
    setProducts(products.map(p =>
      p.id === selectedProductId
        ? { ...p, quantity: p.quantity + quantityToAdd }
        : p
    ));
    setSelectedProductId("");
    setProductSearch("");
    setQuantityToAdd(1);
    setShowDropdown(false);
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-lg neon-glow-red bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold gradient-text mb-6">Add Stock Arrival</h2>
        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs text-white/40 mb-1 block">Search Product</label>
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedProductId(p.id); setProductSearch(p.name); setShowDropdown(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-white/70 hover:bg-white/5 cursor-pointer"
                  >
                    {p.name} ({p.sku}) — {p.quantity} in stock
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-sm text-white/70 font-medium">{selectedProduct.name}</div>
              <div className="text-xs text-white/40">SKU: {selectedProduct.sku}</div>
              <div className="text-xs text-white/40 mt-1">Current stock: {selectedProduct.quantity}</div>
            </div>
          )}

          <div>
            <label className="text-xs text-white/40 mb-1 block">Quantity to Add</label>
            <input
              type="number"
              min={1}
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddStock}
              disabled={!selectedProductId || quantityToAdd <= 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-red to-neon-orange text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add Stock
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
