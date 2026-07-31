import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProducts, getTodaysSales, recordSale } from '../services/api';
import {
  Boxes,
  AlertTriangle,
  Clock,
  IndianRupee,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  RefreshCw,
  Bell,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ShelfMonitor from '../components/ShelfMonitor';
import OCRExtractor from '../components/OCRExtractor';
import { triggerAnalysis, fetchNotifications } from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Search and Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [salesData, setSalesData] = useState({ total_amount: 0, total_transactions: 0 });
  const [topAlerts, setTopAlerts] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const categories = [
    'All',
    'Edible Oils',
    'Flour & Grains',
    'Dairy & Milk',
    'Spices & Salt',
    'Packaged Food',
    'Beverages & Soft Drinks',
    'Personal Care',
    'Household & Cleaning',
    'Snacks & Biscuits'
  ];

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    
    try {
      const [invData, saleData, notifs] = await Promise.all([
        fetchProducts(),
        getTodaysSales(),
        fetchNotifications()
      ]);
      setItems(invData);
      setSalesData(saleData);
      setTopAlerts(notifs.filter(n => !n.is_read).slice(0, 3));
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Could not load inventory from backend engine. Check FastAPI server connectivity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Metrics
  const stats = useMemo(() => {
    const totalSkus = items.length;
    let lowStockCount = 0;
    let nearExpiryCount = 0;
    const totalValuation = items.reduce((acc, item) => acc + ((item.selling_price || 0) * (item.quantity || 0)), 0);

    items.forEach(item => {
      if (item.status === 'Low Stock') lowStockCount++;
      if (item.status === 'Near Expiry') nearExpiryCount++;
      if (item.status === 'Out of Stock') lowStockCount++;
    });

    return {
      totalSkus,
      lowStockCount,
      nearExpiryCount,
      totalValuation: totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    };
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search match
      const s = search.toLowerCase();
      const matchSearch = !search || item.name.toLowerCase().includes(s) || (item.sku && item.sku.toLowerCase().includes(s));
      
      // Category match
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      
      // Status match
      const matchStatus = selectedStatus === 'All' || item.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, selectedCategory, selectedStatus]);

  // Handle Delete and Quantity Adjustments have been moved to ProductsPage

  const handleQuickSale = async () => {
    try {
      await recordSale({ amount: 150.50, items_count: 2, payment_method: "Cash", items: [] });
      const saleData = await getTodaysSales();
      setSalesData(saleData);
      alert("Recorded mock sale of ₹150.50!");
    } catch (err) {
      alert("Failed to log sale.");
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await triggerAnalysis();
      alert(`${res.status}. Generated ${res.alerts_generated} alerts.`);
      loadData(true);
    } catch (err) {
      alert("Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-white">{user?.store_name || 'Kirana Pulse Store'}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-kirana-950 text-kirana-400 border border-kirana-800">Live Dashboard</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Managed by {user?.full_name || 'Store Owner'} • Real-time FastAPI & MongoDB pulse</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-medium flex items-center gap-1.5"
              title="Refresh live stock"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-kirana-400' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 font-bold text-xs border border-purple-900/50 transition-all"
              title="Run Smart Analysis"
            >
              <Cpu className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
              <span className="hidden md:inline">{analyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
            </button>

            <button
              onClick={handleQuickSale}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-900/50 transition-all"
              title="Simulate quick sale"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden md:inline">Log Sale (₹150)</span>
            </button>

            <Link
              to="/products"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-kirana-950 transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>Manage Products</span>
            </Link>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total SKUs</p>
              <p className="text-2xl font-extrabold text-white mt-1">{stats.totalSkus}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-kirana-600/20 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-kirana-400" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Today's Sales</p>
              <p className="text-2xl font-extrabold text-pulseGold mt-1">₹{salesData.total_amount.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-pulseGold" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Low Stock</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.lowStockCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Expired/Near Expiry</p>
              <p className="text-2xl font-extrabold text-purple-300 mt-1">{stats.nearExpiryCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Inventory Value</p>
              <p className="text-2xl font-extrabold text-emerald-300 mt-1">₹{stats.totalValuation}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

        </div>

        {/* Top Alerts Widget */}
        {topAlerts.length > 0 && (
          <div className="glass-panel p-5 rounded-2xl border border-red-900/30 bg-red-950/10 mt-6">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-red-400" />
              Critical Action Required
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topAlerts.map(alert => (
                <div key={alert.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 border-l-4 border-l-red-500">
                  <h4 className="font-bold text-sm text-slate-200">{alert.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <ShelfMonitor />
          <OCRExtractor />
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800/80 p-8 text-center mt-6">
          <h2 className="text-xl font-bold text-white mb-2">Inventory Management Moved</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            You can now manage all your products, barcodes, and supplier details in the new dedicated Products module.
          </p>
          <Link to="/products" className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl transition-all">
            <Boxes className="w-5 h-5" />
            <span>Go to Products Page</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

      </div>

    </div>
  );
}
