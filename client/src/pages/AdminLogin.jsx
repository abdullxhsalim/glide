import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const extractRole = (payload) => {
    const candidateRole = payload?.role ?? payload?.user?.role;
    if (typeof candidateRole === 'string') {
      return candidateRole.trim().toLowerCase();
    }

    if (payload?.isAdmin || payload?.user?.isAdmin) {
      return 'admin';
    }

    return null;
  };

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user?.role === 'admin') {
    return <Navigate to="/admin/portal" replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim().toLowerCase(),
        password: formData.password
      };

      const response = await fetch('/api/users/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        throw new Error(
          `Server returned an unexpected response format (${response.status}). ${rawText.slice(0, 120)}`
        );
      }

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed');
      }

      const role = extractRole(data);
      if (role !== 'admin') {
        throw new Error('Access denied. This portal is for administrators only.');
      }

      login(data);
      navigate('/admin/portal');
    } catch (err) {
      if (err.message === 'Invalid username or password') {
        setError('Invalid admin username or password. Use a valid admin account and try again.');
      } else {
        setError(err.message || 'Unable to log in as admin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0F172A]/85 backdrop-blur-md p-8 rounded-3xl border border-[#334155] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-14 -right-14 w-44 h-44 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-14 -left-14 w-44 h-44 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D] text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Zone
          </div>
          <h1 className="mt-4 text-3xl font-bold text-[#F8FAFC]">Admin Login Portal</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Authorized administrators can sign in to manage the platform.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 border border-red-500/50 bg-red-500/10 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="text-sm font-medium text-gray-300 ml-1">Admin Username</label>
            <div className="relative mt-2 group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-[#F59E0B] transition-colors" />
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#020617] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative mt-2 group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-[#F59E0B] transition-colors" />
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter administrator password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#020617] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-[#F59E0B]/50 cursor-not-allowed'
                : 'bg-[#F59E0B] hover:bg-[#D97706] shadow-[#F59E0B]/30 hover:shadow-[#F59E0B]/50'
            }`}
          >
            {loading ? 'Authenticating...' : <><span>Enter Portal</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center text-sm text-[#94A3B8]">
          Looking for rider login?{' '}
          <Link to="/login" className="text-[#10B981] hover:text-[#059669] font-medium">
            Go to user login
          </Link>
        </div>

        <div className="relative z-10 mt-4 text-center text-sm text-[#94A3B8]">
          Admin accounts are managed internally by the system owner.
        </div>

        <div className="relative z-10 mt-3 text-center text-sm text-[#94A3B8]">
          Back to home?{' '}
          <Link to="/" className="text-[#60A5FA] hover:text-[#3B82F6] font-medium">
            Return to landing page
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
