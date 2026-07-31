import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../services/api';
import { Store, ShieldCheck, LogOut, LayoutDashboard, User, Activity, Sparkles, Boxes, ShoppingCart, BarChart3, Bot } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const getHealthStatus = async () => {
      try {
        const res = await checkHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'offline', database_type: 'Offline Mode' });
      }
    };
    getHealthStatus();
    const interval = setInterval(getHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-kirana-600 via-kirana-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-kirana-900/40 group-hover:scale-105 transition-transform duration-200">
            <Store className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">Kirana<span className="text-kirana-400">Pulse</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Smart Kirana & Shelf Monitoring</p>
          </div>
        </Link>

        {/* Backend Health Status Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-slate-300 font-medium">FastAPI Engine:</span>
          <span className={health?.status === 'online' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {health?.status === 'online' ? health?.database_type || 'Healthy' : 'Offline'}
          </span>
        </div>

        {/* Action Buttons */}
        <nav className="flex items-center space-x-3">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  isCurrent('/dashboard')
                    ? 'bg-kirana-600/20 text-kirana-300 border border-kirana-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link to="/pos" className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                <ShoppingCart className="w-4 h-4" />
                <span>POS</span>
              </Link>
              
              <Link to="/ai-assistant" className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-900/30 border border-purple-800/50 hover:bg-purple-800/40 text-purple-300 hover:text-purple-100 transition-colors text-sm font-semibold shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                <Bot className="w-4 h-4" />
                <span className="hidden lg:inline">AI Assistant</span>
              </Link>
              
              <Link to="/analytics" className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden lg:inline">Analytics</span>
              </Link>
              
              <Link to="/products" className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                <Boxes className="w-4 h-4" />
                <span>Products</span>
              </Link>
              
              <NotificationBell />

              <Link to="/profile" className="hidden sm:flex items-center space-x-2 pl-2 pr-1 py-1 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs hover:bg-slate-700/50 transition-colors">
                <User className="w-3.5 h-3.5 text-kirana-400" />
                <span className="font-semibold text-slate-200 max-w-[120px] truncate">{user.store_name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-kirana-900 text-kirana-300">{user.role}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all border border-transparent hover:border-red-900/40"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-kirana-600 to-emerald-500 text-white shadow-lg shadow-kirana-950 hover:from-kirana-500 hover:to-emerald-400 transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

      </div>
    </header>
  );
}
