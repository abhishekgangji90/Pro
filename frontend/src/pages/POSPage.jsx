import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProducts, recordSale } from '../services/api';
import { Search, Plus, Minus, Trash2, Camera, Printer, ShoppingCart, CheckCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import InvoicePrint from '../components/InvoicePrint';

export default function POSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Scanner
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  
  // Cart
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Print ref
  const printRef = useRef(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Barcode Scanner Global Listener (USB HID Scanner) ---
  useEffect(() => {
    let timeout;
    const handleKeyDown = (e) => {
      // Ignore if typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.trim().length > 0) {
          handleBarcodeScanned(barcodeBuffer.trim());
          setBarcodeBuffer('');
        }
      } else if (e.key.length === 1) {
        setBarcodeBuffer((prev) => prev + e.key);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setBarcodeBuffer('');
        }, 100); // 100ms reset
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [barcodeBuffer, products]);

  // --- Webcam Scanner (html5-qrcode) ---
  useEffect(() => {
    let html5QrcodeScanner;
    if (showScanner) {
      html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      html5QrcodeScanner.render(
        (decodedText) => {
          handleBarcodeScanned(decodedText);
          setShowScanner(false);
        },
        (error) => {} // ignore stream errors
      );
    }
    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, [showScanner]);

  const handleBarcodeScanned = (barcode) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
    } else {
      alert(`Product with barcode ${barcode} not found.`);
    }
  };

  // --- Cart Management ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert('Cannot exceed available stock.');
          return prev;
        }
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: product.selling_price || 0,
        discount: 0,
        gst: 0, // Mock GST 0 by default, could be added to Product Schema
        subtotal: product.selling_price || 0
      }];
    });
    setSuccessMsg(''); // Clear success message on new item
  };

  const updateCartItem = (product_id, field, value) => {
    setCart((prev) => prev.map(item => {
      if (item.product_id === product_id) {
        const newItem = { ...item, [field]: value };
        // Recalculate subtotal
        newItem.subtotal = newItem.quantity * newItem.price;
        return newItem;
      }
      return item;
    }));
  };

  const removeFromCart = (product_id) => {
    setCart((prev) => prev.filter(item => item.product_id !== product_id));
  };

  // --- Computed Totals ---
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    
    cart.forEach(item => {
      subtotal += item.subtotal;
      totalDiscount += (item.subtotal * (item.discount / 100));
      totalGst += ((item.subtotal - (item.subtotal * (item.discount / 100))) * (item.gst / 100));
    });

    const grandTotal = subtotal - totalDiscount + totalGst;

    return { subtotal, totalDiscount, totalGst, grandTotal };
  }, [cart]);

  // --- Filtered Products (Search) ---
  const filteredProducts = useMemo(() => {
    const s = searchQuery.toLowerCase();
    if (!s) return products.slice(0, 12); // Limit to 12 initially for performance
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(s)) || 
      (p.sku && p.sku.toLowerCase().includes(s)) || 
      (p.barcode && p.barcode.toLowerCase().includes(s))
    ).slice(0, 12);
  }, [searchQuery, products]);


  // --- Checkout ---
  const handleCheckout = async (printInvoice = false) => {
    if (cart.length === 0) return;
    
    setProcessing(true);
    try {
      const payload = {
        amount: totals.grandTotal,
        items_count: cart.reduce((acc, item) => acc + item.quantity, 0),
        payment_method: paymentMethod,
        items: cart
      };
      
      await recordSale(payload);
      
      if (printInvoice) {
        window.print();
      }
      
      setSuccessMsg(`Sale recorded successfully! Total: ₹${totals.grandTotal.toFixed(2)}`);
      setCart([]);
      loadInventory(); // Refresh inventory to get updated quantities and statuses
    } catch (err) {
      alert("Checkout failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row h-screen overflow-hidden">
      
      {/* Printable Area (Hidden normally) */}
      <InvoicePrint 
        ref={printRef}
        cart={cart}
        totals={totals}
        paymentMethod={paymentMethod}
        storeInfo={{ name: user?.store_name }}
      />

      {/* Left Panel: Search & Products */}
      <div className="w-full md:w-7/12 lg:w-2/3 p-4 md:p-6 flex flex-col border-r border-slate-800 bg-slate-900/50 print:hidden overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-kirana-400" />
              Point of Sale
            </h1>
            <p className="text-sm text-slate-400">Scan barcodes globally or search products below</p>
          </div>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showScanner ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-kirana-600/20 text-kirana-400 hover:bg-kirana-600/30'
            }`}
          >
            {showScanner ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {showScanner ? 'Close Scanner' : 'Webcam Scan'}
          </button>
        </div>

        {/* Webcam Scanner Div */}
        {showScanner && (
          <div className="mb-6 bg-black rounded-xl overflow-hidden border border-slate-800">
            <div id="reader" className="w-full"></div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-kirana-500 transition-colors"
          />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-kirana-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className={`glass-panel p-4 rounded-xl border ${product.quantity > 0 ? 'border-slate-700 cursor-pointer hover:border-kirana-500 hover:bg-slate-800' : 'border-red-900/50 bg-red-950/20 opacity-50 cursor-not-allowed'} transition-all flex flex-col`}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-slate-200 text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">{product.sku}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800">
                  <span className="font-bold text-emerald-400">₹{product.selling_price}</span>
                  <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400">Qty: {product.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Cart & Checkout */}
      <div className="w-full md:w-5/12 lg:w-1/3 flex flex-col bg-slate-950 border-l border-slate-800 print:hidden h-full">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-kirana-400" />
            Current Order
          </h2>
          <span className="text-xs bg-kirana-900 text-kirana-400 px-2 py-1 rounded-full font-bold">
            {cart.length} Items
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
              <ShoppingCart className="w-12 h-12" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="bg-slate-900 rounded-xl p-3 border border-slate-800 relative group">
                <div className="flex justify-between items-start mb-2 pr-6">
                  <h4 className="font-bold text-sm text-slate-200 line-clamp-2">{item.name}</h4>
                  <span className="font-bold text-emerald-400 text-sm">₹{item.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                    <button onClick={() => updateCartItem(item.product_id, 'quantity', Math.max(1, item.quantity - 1))} className="p-1 hover:bg-slate-800 rounded">
                      <Minus className="w-3 h-3 text-slate-400" />
                    </button>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateCartItem(item.product_id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 bg-transparent text-center text-xs font-bold focus:outline-none"
                    />
                    <button onClick={() => updateCartItem(item.product_id, 'quantity', item.quantity + 1)} className="p-1 hover:bg-slate-800 rounded">
                      <Plus className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-slate-500">Disc%</span>
                      <input 
                        type="number" 
                        value={item.discount}
                        onChange={(e) => updateCartItem(item.product_id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-10 bg-slate-800 rounded p-1 text-center text-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-slate-500">GST%</span>
                      <input 
                        type="number" 
                        value={item.gst}
                        onChange={(e) => updateCartItem(item.product_id, 'gst', parseFloat(e.target.value) || 0)}
                        className="w-10 bg-slate-800 rounded p-1 text-center text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.product_id)}
                  className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 p-1.5 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 mt-auto">
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-kirana-400">
                <span>Discount</span>
                <span>-₹{totals.totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {totals.totalGst > 0 && (
              <div className="flex justify-between text-yellow-400">
                <span>Total GST</span>
                <span>+₹{totals.totalGst.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-lg text-white">
              <span>Total Amount</span>
              <span className="text-emerald-400">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">Payment Method</p>
            <div className="flex space-x-2">
              {['Cash', 'UPI', 'Card'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentMethod === method ? 'bg-kirana-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0 || processing}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-lg"
            >
              {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Checkout'}
            </button>
            <button
              onClick={() => handleCheckout(true)}
              disabled={cart.length === 0 || processing}
              className="py-3 px-4 bg-kirana-600 hover:bg-kirana-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
            >
              {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
              <span>Print Bill</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
