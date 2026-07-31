import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  LineChart,
  Boxes,
  BellRing,
  Sparkles,
  Camera,
  Smartphone,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        
        {/* Glowing Background Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-kirana-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pulseGold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-kirana-500/30 text-kirana-300 text-xs font-semibold mb-6 shadow-inner animate-pulse-slow">
            <Sparkles className="w-4 h-4 text-kirana-400" />
            <span>Next-Gen Smart Inventory for Indian Kirana Stores</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
            Kirana<span className="text-transparent bg-clip-text bg-gradient-to-r from-kirana-400 via-emerald-300 to-pulseGold">Pulse</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl font-medium text-slate-300 max-w-3xl mx-auto">
            AI Smart Inventory & Shelf Monitoring System
          </p>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate stockouts, prevent spoilage with automated shelf expiry alerts, and optimize daily sales with real-time FastAPI + MongoDB inventory analytics.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-kirana-600 via-kirana-500 to-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-kirana-950/60 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Launch Store Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-base hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span>Owner Sign In</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-xl text-center border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-kirana-400">99.4%</p>
              <p className="text-xs text-slate-400 mt-1">Stock Accuracy</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">0%</p>
              <p className="text-xs text-slate-400 mt-1">Expired Waste</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">&lt; 1 sec</p>
              <p className="text-xs text-slate-400 mt-1">FastAPI Latency</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400">24 / 7</p>
              <p className="text-xs text-slate-400 mt-1">Shelf Pulse Monitoring</p>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-white">Engineered Specifically for Modern Kiranas</h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Traditional inventory software is too slow for fast-paced retail shelves. KiranaPulse gives you complete visual control over your store stock in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-card p-6 rounded-2xl relative group">
              <div className="w-12 h-12 rounded-xl bg-kirana-600/20 border border-kirana-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6 text-kirana-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real-Time Stock Thresholds</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically flags items reaching low stock levels based on custom minimum thresholds so you reorder before shelves run dry.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-6 rounded-2xl relative group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BellRing className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Shelf Expiry Prevention</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Smart color-coded shelf badges notify staff 7 days before dairy, packaged goods, or snacks reach expiration dates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-6 rounded-2xl relative group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Quick Stock Updates</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Increment or decrement item counts with a single tap directly from your mobile or tablet POS station during rush hours.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* AI Vision System Preview Banner */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8">
            
            <div className="lg:w-1/2 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-kirana-950 border border-kirana-800 text-kirana-300 text-xs font-semibold">
                <Camera className="w-3.5 h-3.5" />
                <span>AI Vision Ready Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Designed to integrate with Vision & OCR AI Engine
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                The KiranaPulse architecture is pre-configured for instant pairing with Gemini Vision, EasyOCR, and Tesseract for automatic shelf camera scans and invoice scanning in Phase 2.
              </p>
              <ul className="space-y-2 text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kirana-400" /> FastAPI Async Endpoint Pipeline</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kirana-400" /> MongoDB Document Store Schema</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kirana-400" /> Secure JWT Bearer Authentication</li>
              </ul>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Store Shelf Live Monitor</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">ONLINE</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Fortune Sunlite Sunflower Oil 1L</p>
                      <p className="text-xs text-slate-400">Aisle A • Rack 2</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">In Stock (28)</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Aashirvaad Shuddh Atta 5kg</p>
                      <p className="text-xs text-slate-400">Aisle B • Rack 1</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">Low Stock (4 left)</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to pulse-check your Kirana inventory?</h2>
          <p className="mt-3 text-slate-400 text-base">Start managing your store inventory with zero setup fee.</p>
          <div className="mt-6">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-kirana-600 hover:bg-kirana-500 text-white font-bold text-base shadow-xl shadow-kirana-950 transition-all"
            >
              <span>Create Owner Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
