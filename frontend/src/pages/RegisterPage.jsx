import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, UserPlus, AlertCircle, Loader2, FileText, Phone } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store_name: 'Gupta Kirana & General Store',
    store_address: '123 Main Street',
    gst_number: '22AAAAA0000A1Z5',
    store_contact: '9876543210',
    full_name: 'Rajesh Gupta',
    email: '',
    phone: '9876543210',
    password: '',
    confirm_password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name || !formData.store_name) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    const payload = {
      user: {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone
      },
      store: {
        name: formData.store_name,
        address: formData.store_address,
        gst_number: formData.gst_number,
        contact_number: formData.store_contact
      }
    };

    try {
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full glass-panel border border-slate-800 rounded-3xl p-8 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-3 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-kirana-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-kirana-950">
              <Store className="w-7 h-7 text-slate-950 font-bold" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-white">Register Store Account</h2>
          <p className="text-xs text-slate-400 mt-1">Create your owner profile and set up your store</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-kirana-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Store className="w-4 h-4" /> Store Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Name *</label>
                <input type="text" name="store_name" value={formData.store_name} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GST Number</label>
                <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Address</label>
                <input type="text" name="store_address" value={formData.store_address} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Contact No.</label>
                <input type="text" name="store_contact" value={formData.store_contact} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2 pt-2">
              <UserPlus className="w-4 h-4" /> Owner Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Personal Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-kirana-500" required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-kirana-600 to-emerald-500 hover:from-kirana-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-kirana-950/60 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-5">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Creating Account...</span></> : <><UserPlus className="w-4 h-4" /><span>Create Kirana Account</span></>}
          </button>

        </form>

        <p className="text-center text-xs text-slate-400 mt-5">
          Already registered? <Link to="/login" className="text-kirana-400 font-semibold hover:underline">Sign In here</Link>
        </p>

      </div>
    </div>
  );
}
