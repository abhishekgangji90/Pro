import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck, FileText, ScanText, Clock, PackageCheck, Barcode, Database, CheckCircle2 } from 'lucide-react';
import { extractOCRImage, getOCRHistory } from '../services/api';

export default function OCRExtractor() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getOCRHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    try {
      const result = await extractOCRImage(file);
      setHistory((prev) => [result, ...prev]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to extract text from image.');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Safe':
        return 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400';
      case 'Near Expiry':
        return 'bg-yellow-950/40 border-yellow-800/80 text-yellow-400';
      case 'Expired':
        return 'bg-red-950/40 border-red-800/80 text-red-400';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Safe': return <ShieldCheck className="w-5 h-5" />;
      case 'Near Expiry': return <Clock className="w-5 h-5" />;
      case 'Expired': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScanText className="w-6 h-6 text-kirana-400" />
            OCR Product Scanner & Barcode Lookup
          </h2>
          <p className="text-sm text-slate-400 mt-1">Extract dates, read barcodes & instantly fetch store inventory details</p>
        </div>
        
        <div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 transition-all w-full sm:w-auto justify-center cursor-pointer"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span>{analyzing ? 'Scanning & Reading...' : 'Scan Product / Label'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-kirana-500 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
          <ScanText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-medium">No OCR Scans Yet</h3>
          <p className="text-sm text-slate-500 mt-1">Scan a product label or barcode to auto-fetch inventory details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item, idx) => (
            <div key={item.id || idx} className={`p-4 rounded-xl border flex flex-col justify-between ${getCategoryStyles(item.category)}`}>
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(item.category)}
                    <span className="font-bold text-sm uppercase tracking-wider">{item.category}</span>
                  </div>
                  {item.days_remaining !== null && (
                    <span className="text-xs font-bold px-2 py-1 bg-black/30 rounded-lg">
                      {item.days_remaining} Days Left
                    </span>
                  )}
                </div>
                
                <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.product_name || 'Unknown Product'}</h4>
                
                <div className="space-y-1.5 text-sm text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      Barcode:
                    </span> 
                    <span className="font-mono text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {item.barcode || 'Not Detected'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span>MRP:</span> <span className="font-medium text-white">{item.mrp ? `₹${item.mrp}` : 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Batch:</span> <span className="font-medium text-white">{item.batch_number || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Mfg Date:</span> <span className="font-medium text-white">{item.mfg_date || 'Not Specified'}</span></div>
                  <div className="flex justify-between"><span>Expiry Date:</span> <span className="font-medium text-white">{item.expiry_date || 'Not Specified'}</span></div>
                </div>

                {/* Inventory Database Match Badge & Details */}
                {item.matched_product ? (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-2">
                      <Database className="w-3.5 h-3.5" />
                      <span>Matched in Inventory ({item.matched_product.name})</span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex justify-between"><span>Inventory Stock:</span> <span className="font-bold text-emerald-300">{item.matched_product.quantity} {item.matched_product.unit || 'Pcs'}</span></div>
                      <div className="flex justify-between"><span>Selling Price:</span> <span className="font-bold text-white">₹{item.matched_product.selling_price}</span></div>
                      {item.matched_product.mfg_date && (
                        <div className="flex justify-between"><span>DB Mfg Date:</span> <span className="font-medium text-emerald-200">{item.matched_product.mfg_date}</span></div>
                      )}
                      {item.matched_product.expiry_date && (
                        <div className="flex justify-between"><span>DB Expiry Date:</span> <span className="font-medium text-emerald-200">{item.matched_product.expiry_date}</span></div>
                      )}
                      <div className="flex justify-between"><span>Category & SKU:</span> <span className="font-medium text-slate-300">{item.matched_product.category} ({item.matched_product.sku})</span></div>
                      <div className="flex justify-between"><span>Location:</span> <span className="font-medium text-slate-300">{item.matched_product.shelf_location}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 italic">
                    <AlertTriangle className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>No barcode match found in store inventory</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-black/10 text-[10px] text-right opacity-70">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
