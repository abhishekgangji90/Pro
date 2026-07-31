import React from 'react';
import { Store, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-kirana-600/30 border border-kirana-500/40 flex items-center justify-center">
            <Store className="w-4 h-4 text-kirana-400" />
          </div>
          <span className="font-semibold text-slate-200">KiranaPulse</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-400">Smart Retail & Shelf Monitoring Solution</span>
        </div>

        <div className="flex items-center space-x-6 text-xs text-slate-400">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Fast & Reliable FastAPI Backend</span>
          <span className="flex items-center gap-1">Built for Kirana Owners</span>
        </div>

        <div className="text-xs text-slate-400">
          © {new Date().getFullYear()} KiranaPulse. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
