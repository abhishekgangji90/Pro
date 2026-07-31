import React, { useState, useEffect } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import ProductModal from '../components/ProductModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Barcode
} from 'lucide-react';

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const categories = [
    'All', 'General', 'Edible Oils', 'Snacks', 'Beverages', 'Personal Care'
  ];
  
  const statuses = [
    'All', 'In Stock', 'Low Stock', 'Near Expiry', 'Expired Items', 'Out of Stock'
  ];

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProducts();
      setItems(data);
    } catch (err) {
      setError('Could not load products. Check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdate = async (productData) => {
    try {
      if (editingItem) {
        await updateProduct(editingItem.id, productData);
      } else {
        await createProduct(productData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save product.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        loadData();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete product.");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">In Stock</span>;
      case 'Low Stock': return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold">Low Stock</span>;
      case 'Near Expiry': return <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold">Near Expiry</span>;
      case 'Expired Items': return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold">Expired</span>;
      default: return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-lg text-xs font-bold">Out of Stock</span>;
    }
  };

  // Filter items in memory
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name && item.name.toLowerCase().includes(search.toLowerCase())) || 
                          (item.sku && item.sku.toLowerCase().includes(search.toLowerCase())) ||
                          (item.barcode && item.barcode.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || item.category === category;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Boxes className="w-7 h-7 text-kirana-400" /> Complete Inventory
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage all your products, barcodes, pricing, and suppliers.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-kirana-400 hover:border-kirana-500/30 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-kirana-600 hover:bg-kirana-500 text-white font-bold text-sm transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center gap-3 text-red-400 text-sm font-semibold">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or Barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-kirana-500 text-white outline-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-kirana-500 text-white outline-none text-sm appearance-none min-w-[140px]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-kirana-500 text-white outline-none text-sm appearance-none min-w-[140px]"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            {loading && items.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-kirana-500 mb-4" />
                <p>Loading products...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Product Details</th>
                    <th className="px-6 py-4">Identifiers</th>
                    <th className="px-6 py-4">Stock & Shelf</th>
                    <th className="px-6 py-4">Pricing</th>
                    <th className="px-6 py-4">Status & Dates</th>
                    <th className="px-6 py-4 rounded-tr-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        No products found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-slate-100 font-bold">{item.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-200 font-mono text-xs"><span className="text-slate-500">SKU:</span> {item.sku}</p>
                          {item.barcode && (
                            <p className="text-slate-300 flex items-center gap-1 mt-1 text-[11px]">
                              <Barcode className="w-3 h-3" /> {item.barcode}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-bold">{item.quantity} <span className="text-slate-500 text-xs font-normal">{item.unit}</span></p>
                          <p className="text-[10px] text-slate-400 mt-1">Loc: <span className="text-slate-300">{item.shelf_location || 'N/A'}</span></p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-kirana-400 font-bold">₹{(item.selling_price || item.price || 0).toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">/ selling</span></p>
                          <p className="text-slate-400 text-[11px] mt-1">₹{(item.purchase_price || 0).toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">/ purchase</span></p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(item.status)}
                          {item.expiry_date && (
                            <p className="text-[10px] text-slate-400 mt-1">Exp: <span className="text-slate-300">{item.expiry_date.split('T')[0]}</span></p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-slate-800 text-kirana-400 hover:bg-slate-700 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg bg-slate-800 text-red-400 hover:bg-slate-700 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
      />
    </div>
  );
}
