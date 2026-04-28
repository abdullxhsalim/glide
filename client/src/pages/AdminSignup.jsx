import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { User, Mail, Hash, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSignup = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
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
        ...formData,
        email: formData.email.trim().toLowerCase(),
        studentId: formData.studentId.trim()
      };

      const response = await fetch('/api/users/register-admin', {
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
        throw new Error(`Server returned an unexpected response format (${response.status}). ${rawText.slice(0, 120)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Admin registration failed');
      }

      login(data);
      navigate('/admin/portal');
    } catch (err) {
      setError(err.message || 'Unable to register admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative z-10 flex-1">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-[#0F172A]/85 backdrop-blur-md p-8 rounded-3xl border border-[#334155] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-14 -right-14 w-44 h-44 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-14 -left-14 w-44 h-44 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <h1 className="mt-1 text-3xl font-bold text-[#F8FAFC]">Admin Registration</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Create an administrator account to manage platform operations.
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

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
              <div className="relative mt-2 group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-[#F59E0B] transition-colors" />
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Admin Name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#020617] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 ml-1">Student ID</label>
              <div className="relative mt-2 group">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-[#F59E0B] transition-colors" />
                <input
                  name="studentId"
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="ADMIN-1001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#020617] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 ml-1">Admin Email</label>
            <div className="relative mt-2 group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-[#F59E0B] transition-colors" />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@yourdomain.com"
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
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
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
            {loading ? 'Creating Admin...' : <><span>Create Admin</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center text-sm text-[#94A3B8]">
          Already have an admin account?{' '}
          <Link to="/admin/login" className="text-[#10B981] hover:text-[#059669] font-medium">
            Go to admin login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSignup;
