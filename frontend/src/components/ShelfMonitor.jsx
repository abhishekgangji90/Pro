import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, PackageX, Scan, XCircle, Search, ShieldAlert } from 'lucide-react';
import { analyzeShelfImage, getLatestShelfScan } from '../services/api';

export default function ShelfMonitor() {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const fetchLatestScan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLatestShelfScan();
      setScanData(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setScanData(null);
      } else {
        setError('Failed to fetch latest scan data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestScan();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeShelfImage(file);
      setScanData(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze shelf image.');
    } finally {
      setAnalyzing(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getHealthColor = (score) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderItemList = (title, icon, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          {icon}
          <h4 className="font-semibold text-slate-200">{title} ({items.length})</h4>
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <div className="font-medium text-slate-300">{item.name}</div>
              {item.notes && <div className="text-xs text-slate-500 mt-1">{item.notes}</div>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 mb-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scan className="w-6 h-6 text-kirana-400" />
            AI Shelf Monitor
          </h2>
          <p className="text-sm text-slate-400 mt-1">Automatically track shelf health and anomalies</p>
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
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 transition-all"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span>{analyzing ? 'Analyzing Shelf...' : 'Scan Shelf'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-kirana-500 animate-spin" />
        </div>
      ) : !scanData ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-medium">No Scans Yet</h3>
          <p className="text-sm text-slate-500 mt-1">Take a photo of your store shelf to generate the first AI report.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Health Score Banner */}
          <div className="flex items-center p-6 bg-slate-950 rounded-2xl border border-slate-800 justify-between">
            <div>
              <div className="text-sm text-slate-400 font-medium mb-1">Overall Shelf Health</div>
              <div className={`text-5xl font-black ${getHealthColor(scanData.health_score)}`}>
                {scanData.health_score}%
              </div>
            </div>
            
            <div className="text-right">
              {scanData.empty_shelves_detected && (
                <div className="inline-flex items-center space-x-1 px-3 py-1 bg-red-950/60 text-red-400 rounded-full text-xs font-semibold border border-red-900/60 mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Large Empty Gaps Detected</span>
                </div>
              )}
              <div className="text-xs text-slate-500 block mt-2">
                Last Scan: {new Date(scanData.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Anomaly Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderItemList(
              'Missing Products',
              <PackageX className="w-5 h-5 text-red-400" />,
              scanData.missing_products
            )}
            {renderItemList(
              'Low Stock',
              <AlertTriangle className="w-5 h-5 text-yellow-400" />,
              scanData.low_stock
            )}
            {renderItemList(
              'Misplaced Items',
              <Search className="w-5 h-5 text-purple-400" />,
              scanData.misplaced_items
            )}
            {renderItemList(
              'Damaged Packaging',
              <XCircle className="w-5 h-5 text-orange-400" />,
              scanData.damaged_items
            )}
            {renderItemList(
              'Expired Items',
              <ShieldAlert className="w-5 h-5 text-red-500" />,
              scanData.expired_products
            )}
          </div>

          {/* All Good State */}
          {(!scanData.missing_products?.length && !scanData.low_stock?.length && !scanData.misplaced_items?.length && !scanData.damaged_items?.length && !scanData.expired_products?.length) && (
            <div className="flex flex-col items-center justify-center p-8 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
              <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
              <div className="text-emerald-400 font-medium">Shelf looks perfect!</div>
              <div className="text-xs text-emerald-500/70 mt-1">No anomalies detected by AI.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
