import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save user data
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            // Navigate to Dashboard
            navigate('/dash');
        } catch (err) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-md p-8 rounded-3xl border border-[#334155] shadow-2xl relative overflow-hidden"
            >
                 {/* Decorative background elements inside card */}
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#4F46E5]/10 rounded-full blur-3xl pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-[#94A3B8]">
                        Sign in to continue your journey
                    </p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center gap-2"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                placeholder="student@university.edu.bd"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <input 
                                id="remember-me" 
                                name="remember-me" 
                                type="checkbox" 
                                className="h-4 w-4 rounded border-gray-600 bg-[#0F172A] text-[#10B981] focus:ring-[#10B981]" 
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-gray-400">Remember me</label>
                        </div>
                        <div className="text-sm">
                            <a href="#" className="font-medium text-[#10B981] hover:text-[#059669] transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-white ${
                            loading 
                            ? 'bg-[#4F46E5]/50 cursor-not-allowed' 
                            : 'bg-[#4F46E5] hover:bg-[#4338CA] shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50'
                        }`}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>Sign In <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#334155] text-center w-full">
                    <p className="text-sm text-[#94A3B8]">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-[#10B981] hover:text-[#059669] transition-colors">
                            Sign up now
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;