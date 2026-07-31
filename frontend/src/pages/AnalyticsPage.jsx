import React, { useState, useEffect } from 'react';
import { fetchAnalyticsDashboard } from '../services/api';
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  IndianRupee, TrendingUp, AlertTriangle, Layers, Loader2, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesView, setSalesView] = useState('daily'); // daily, weekly, monthly

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("KiranaPulse - Store Analytics Report", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    const { overview, charts } = data;
    
    // Overview metrics
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `Rs. ${overview.total_revenue}`],
        ['Total Profit', `Rs. ${overview.total_profit} (${overview.profit_margin}%)`],
        ['Inventory Value', `Rs. ${overview.inventory_value}`],
        ['Expired Loss', `Rs. ${overview.expired_loss}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Top Selling
    doc.text("Top Selling Products", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product Name', 'Quantity Sold']],
      body: charts.top_selling.map(p => [p.name, p.Sold]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save("KiranaPulse_Analytics.pdf");
  };

  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    
    // Overview Sheet
    const overviewData = [
      ["Metric", "Value"],
      ["Total Revenue", data.overview.total_revenue],
      ["Total Profit", data.overview.total_profit],
      ["Profit Margin (%)", data.overview.profit_margin],
      ["Inventory Value", data.overview.inventory_value],
      ["Expired Loss", data.overview.expired_loss]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
    
    // Sales Sheet
    const wsSales = XLSX.utils.json_to_sheet(data.charts[`${salesView}_sales`]);
    XLSX.utils.book_append_sheet(wb, wsSales, "Sales Trends");
    
    // Top Products
    const wsTop = XLSX.utils.json_to_sheet(data.charts.top_selling);
    XLSX.utils.book_append_sheet(wb, wsTop, "Top Products");
    
    XLSX.writeFile(wb, "KiranaPulse_Analytics.xlsx");
  };

  const handleExportCSV = () => {
    if (!data) return;
    const ws = XLSX.utils.json_to_sheet(data.charts[`${salesView}_sales`]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "KiranaPulse_Sales.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-kirana-500 mb-4" />
        <p>Crunching the numbers...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="p-6 bg-red-950/30 border border-red-900 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" /> {error}
        </div>
      </div>
    );
  }

  const { overview, charts } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-300 font-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.toLowerCase().includes('sold') ? entry.value : `₹${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-kirana-400" /> Advanced Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">Deep insights into your store's performance and inventory health.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors">
              <FileText className="w-4 h-4" /> CSV
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-emerald-900/30 border border-emerald-800 hover:bg-emerald-800 text-emerald-400 rounded-lg text-xs font-bold transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-800 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Revenue</p>
              <p className="text-2xl font-extrabold text-white mt-1">₹{overview.total_revenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-kirana-600/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-kirana-400" />
            </div>
          </div>
          
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Gross Profit</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹{overview.total_profit.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-500 mt-1">{overview.profit_margin}% margin</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Inventory Value</p>
              <p className="text-2xl font-extrabold text-blue-400 mt-1">₹{overview.inventory_value.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-red-900/30 bg-red-950/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-red-400 font-semibold uppercase">Expired Loss</p>
              <p className="text-2xl font-extrabold text-red-400 mt-1">₹{overview.expired_loss.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sales Trends */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">Sales Trends</h3>
              <div className="flex bg-slate-900 rounded-lg p-1">
                {['daily', 'weekly', 'monthly'].map(view => (
                  <button
                    key={view}
                    onClick={() => setSalesView(view)}
                    className={`px-3 py-1 rounded text-xs font-bold capitalize ${salesView === view ? 'bg-kirana-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts[`${salesView}_sales`]}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Performance */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
            <h3 className="font-bold text-white mb-6">Sales by Category</h3>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.category_performance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="Value"
                  >
                    {charts.category_performance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-6">Top Selling Products</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.top_selling} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="Sold" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Least Products */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-6">Least Selling Products</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.least_selling} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="Sold" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-6">Stock Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.stock_distribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="Value"
                  >
                    {charts.stock_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
