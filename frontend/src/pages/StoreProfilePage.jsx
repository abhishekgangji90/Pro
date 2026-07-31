import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStoreProfile, updateStoreProfile, addEmployee } from '../services/api';
import { Store, UserPlus, Save, AlertCircle, CheckCircle2, Shield, User } from 'lucide-react';

export default function StoreProfilePage() {
  const { user } = useAuth();
  
  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    gst_number: '',
    contact_number: ''
  });
  
  const [empData, setEmpData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Staff'
  });

  const [loading, setLoading] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [empMessage, setEmpMessage] = useState('');
  const [empError, setEmpError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getStoreProfile();
        setStoreData({
          name: data.name || '',
          address: data.address || '',
          gst_number: data.gst_number || '',
          contact_number: data.contact_number || ''
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleStoreUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await updateStoreProfile(storeData);
      setMessage('Store profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update store profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setEmpLoading(true);
    setEmpMessage('');
    setEmpError('');
    try {
      await addEmployee(empData);
      setEmpMessage(`Employee ${empData.full_name} added as ${empData.role}.`);
      setEmpData({ full_name: '', email: '', phone: '', password: '', role: 'Staff' });
    } catch (err) {
      setEmpError(err.response?.data?.detail || 'Failed to add employee.');
    } finally {
      setEmpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Store className="w-6 h-6 text-kirana-400" /> Store Profile & Settings
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage your store details and employee accounts</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Logged in as <strong className="text-white">{user?.full_name}</strong> ({user?.role})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Store Profile Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Store Information</h2>
            
            {message && <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{message}</div>}
            {error && <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

            <form onSubmit={handleStoreUpdate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Name</label>
                <input type="text" value={storeData.name} onChange={e => setStoreData({...storeData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" disabled={user?.role !== 'Owner'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input type="text" value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" disabled={user?.role !== 'Owner'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GST Number</label>
                  <input type="text" value={storeData.gst_number} onChange={e => setStoreData({...storeData, gst_number: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" disabled={user?.role !== 'Owner'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Number</label>
                  <input type="text" value={storeData.contact_number} onChange={e => setStoreData({...storeData, contact_number: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" disabled={user?.role !== 'Owner'} />
                </div>
              </div>
              
              {user?.role === 'Owner' && (
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-kirana-600 hover:bg-kirana-500 text-white font-semibold text-xs flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Store Profile
                </button>
              )}
            </form>
          </div>

          {/* Employee Management Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 opacity-95">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" /> Add Employee Account
            </h2>
            
            {user?.role === 'Staff' ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                You do not have permission to add employees.
              </div>
            ) : (
              <>
                {empMessage && <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{empMessage}</div>}
                {empError && <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" />{empError}</div>}

                <form onSubmit={handleAddEmployee} className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                      <input type="text" value={empData.full_name} onChange={e => setEmpData({...empData, full_name: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                      <select value={empData.role} onChange={e => setEmpData({...empData, role: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none">
                        <option value="Staff">Staff</option>
                        {user?.role === 'Owner' && <option value="Manager">Manager</option>}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email (Login ID)</label>
                    <input type="email" value={empData.email} onChange={e => setEmpData({...empData, email: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                      <input type="text" value={empData.phone} onChange={e => setEmpData({...empData, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                      <input type="password" value={empData.password} onChange={e => setEmpData({...empData, password: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-kirana-500 outline-none" />
                    </div>
                  </div>
                  
                  <button type="submit" disabled={empLoading} className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700">
                    <UserPlus className="w-4 h-4" /> Add {empData.role}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
