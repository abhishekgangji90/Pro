import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Eye, EyeOff, LogIn, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('owner@kiranapulse.com');
    setPassword('kirana123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-kirana-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-kirana-950">
              <Store className="w-7 h-7 text-slate-950 font-bold" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-white">Kirana Store Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">Access your store inventory & shelf monitoring dashboard</p>
        </div>

        {/* Quick Demo Credentials Button */}
        <div className="mb-6 p-3 rounded-xl bg-slate-900/80 border border-kirana-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-kirana-400 shrink-0" />
            <span>Quick Demo Evaluation?</span>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-3 py-1 rounded-lg bg-kirana-950 text-kirana-300 border border-kirana-700 hover:bg-kirana-900 text-xs font-semibold transition-all"
          >
            Auto-Fill Demo
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@kiranapulse.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-kirana-500 focus:ring-1 focus:ring-kirana-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-kirana-500 focus:ring-1 focus:ring-kirana-500 text-sm pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-kirana-950/60 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>

        </form>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have a store account?{' '}
          <Link to="/register" className="text-kirana-400 font-semibold hover:underline">
            Register your Kirana Store
          </Link>
        </p>

      </div>
    </div>
  );
}
