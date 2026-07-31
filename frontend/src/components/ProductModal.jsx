import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader2, Save, ScanLine } from 'lucide-react';
import { analyzeProductImage } from '../services/api';

export default function ProductModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    sku: '',
    barcode: '',
    qrcode: '',
    batch_number: '',
    mfg_date: '',
    expiry_date: '',
    supplier_name: '',
    supplier_contact: '',
    purchase_price: 0,
    selling_price: 0,
    quantity: 0,
    min_stock: 5,
    unit: 'Pcs',
    shelf_location: 'Shelf A',
    image_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        mfg_date: initialData.mfg_date ? initialData.mfg_date.split('T')[0] : '',
        expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '', category: 'General', sku: '', barcode: '', qrcode: '', batch_number: '',
        mfg_date: '', expiry_date: '', supplier_name: '', supplier_contact: '',
        purchase_price: 0, selling_price: 0, quantity: 0, min_stock: 5, unit: 'Pcs',
        shelf_location: 'Shelf A', image_url: ''
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (type === 'number') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const data = await analyzeProductImage(file);
      setFormData(prev => ({
        ...prev,
        name: data.product_name || prev.name,
        category: data.category || prev.category,
        sku: data.sku || prev.sku,
        barcode: data.barcode || prev.barcode,
        qrcode: data.qr_code || prev.qrcode,
        batch_number: data.batch_number || prev.batch_number,
        mfg_date: data.mfg_date || prev.mfg_date,
        expiry_date: data.expiry_date || prev.expiry_date,
        supplier_name: data.supplier_name || prev.supplier_name,
        supplier_contact: data.supplier_contact || prev.supplier_contact,
        purchase_price: data.purchase_price || prev.purchase_price,
        selling_price: data.selling_price || prev.selling_price,
        quantity: data.qty !== undefined ? data.qty : prev.quantity,
        min_stock: data.min_alert !== undefined ? data.min_alert : prev.min_stock,
        unit: data.unit || prev.unit,
        shelf_location: data.shelf_location || prev.shelf_location,
      }));
    } catch (err) {
      alert("Failed to analyze image: " + (err.response?.data?.detail || err.message));
    } finally {
      setAnalyzing(false);
      // Reset input so the same file can be chosen again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-kirana-400" />
              {initialData ? 'Edit Product' : 'Add New Product'}
            </h2>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageCapture}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-kirana-600/20 text-kirana-400 hover:bg-kirana-600/30 border border-kirana-500/30 transition-all text-xs font-bold disabled:opacity-50"
              title="Scan with Camera"
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
              {analyzing ? 'Analyzing...' : 'Auto-fill from Image'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Scan Button */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="sm:hidden flex items-center gap-2 p-2 rounded-lg bg-kirana-600/20 text-kirana-400 hover:bg-kirana-600/30 border border-kirana-500/30 transition-all disabled:opacity-50"
              title="Scan with Camera"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-kirana-400 border-b border-slate-800 pb-2">Basic Info</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm">
                  <option value="General">General</option>
                  <option value="Edible Oils">Edible Oils</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Personal Care">Personal Care</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL</label>
                <input type="url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU *</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Shelf Location</label>
                  <input type="text" name="shelf_location" value={formData.shelf_location} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm uppercase" />
                </div>
              </div>
            </div>

            {/* Column 2: Tracking & Stock */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-400 border-b border-slate-800 pb-2">Tracking & Stock</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Barcode</label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">QR Code</label>
                  <input type="text" name="qrcode" value={formData.qrcode} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qty *</label>
                  <input type="number" name="quantity" min="0" value={formData.quantity} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Alert *</label>
                  <input type="number" name="min_stock" min="0" value={formData.min_stock} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm">
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Number</label>
                <input type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm uppercase" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mfg Date</label>
                  <input type="date" name="mfg_date" value={formData.mfg_date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Date</label>
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Column 3: Supplier & Pricing */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-400 border-b border-slate-800 pb-2">Pricing & Supplier</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Price (₹) *</label>
                  <input type="number" step="0.01" min="0" name="purchase_price" value={formData.purchase_price} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price (₹) *</label>
                  <input type="number" step="0.01" min="0" name="selling_price" value={formData.selling_price} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Name</label>
                <input type="text" name="supplier_name" value={formData.supplier_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Contact</label>
                <input type="text" name="supplier_contact" value={formData.supplier_contact} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-kirana-500 outline-none text-sm" />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : <><Save className="w-4 h-4"/> Save Product</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
