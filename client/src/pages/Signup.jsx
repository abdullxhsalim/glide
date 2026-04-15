import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Key, Car, Hash, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// External Progress Bar Component to prevent re-renders
const ProgressBar = ({ step, totalSteps }) => (
    <div className="w-full mb-8">
        <div className="flex justify-between mb-2 px-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
                <div 
                    key={idx} 
                    className={`text-xs font-bold uppercase tracking-wider ${step > idx + 1 ? 'text-[#10B981]' : step === idx + 1 ? 'text-[#4F46E5]' : 'text-slate-600'}`}
                >
                    Step {idx + 1}
                </div>
            ))}
        </div>
        <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
            <motion.div
                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#10B981]"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            />
        </div>
    </div>
);

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        studentId: '',
        contactNumber: '',
        password: '',
        confirmPassword: '',
        role: 'rider', // default role
        vehicle: {
            make: '',
            model: '',
            color: '',
            licensePlate: '',
            year: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Calculate total steps based on role
    const totalSteps = formData.role === 'driver' ? 4 : 3;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleNext = () => {
        // Validation check for steps
        if (step === 2) {
                 if (!formData.name || !formData.email || !formData.studentId || !formData.contactNumber) {
                setError("Please fill in all personal fields.");
                return;
             }
             if (!validateEmail(formData.email)) {
                setError("Please enter a valid email address.");
                return;
             }
        }
        if (step === 3) {
            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match");
                return;
            }
        }

        setError(null);
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Vehicle validation if driver
        if (formData.role === 'driver' && (!formData.vehicle.licensePlate || !formData.vehicle.model)) {
            setError("Please fill in vehicle details.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    studentId: formData.studentId,
                    contactNumber: formData.contactNumber,
                    password: formData.password,
                    role: formData.role,
                    vehicle: formData.role === 'driver' ? formData.vehicle : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Save user data and navigate
            login(data);
            navigate('/dash');
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-[#1E293B]/80 backdrop-blur-md p-8 rounded-3xl border border-[#334155] shadow-2xl relative overflow-hidden"
            >
                 {/* Decorative background elements inside card */}
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#4F46E5]/10 rounded-full blur-3xl pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10 transition-all duration-300">
                    <h2 key={step} className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
                        {step === 1 ? "Choose Your Path" : 
                         step === 2 ? "Who Are You?" :
                         step === 3 ? "Secure Account" : "Your Chariot"}
                    </h2>
                    <p className="mt-2 text-sm text-[#94A3B8]">
                        Join the University's exclusive carpool network
                    </p>
                </div>

                <ProgressBar step={step} totalSteps={totalSteps} />

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

                <form onSubmit={handleSubmit} noValidate className="w-full relative">
                <div className="relative min-h-[340px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div 
                                    onClick={() => setFormData({ ...formData, role: 'rider' })}
                                    className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-6 group hover:shadow-xl hover:scale-[1.02] ${
                                        formData.role === 'rider' 
                                            ? 'border-[#10B981] bg-[#10B981]/10 ring-1 ring-[#10B981]' 
                                            : 'border-[#334155] hover:border-[#4F46E5]/50 hover:bg-[#334155]/30'
                                    }`}
                                >
                                    <div className={`p-4 rounded-full ${formData.role === 'rider' ? 'bg-[#10B981] text-white' : 'bg-[#1E293B] text-[#94A3B8]'} transition-colors`}>
                                        <MapPin className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold ${formData.role === 'rider' ? 'text-[#10B981]' : 'text-gray-200'}`}>Hopper (Rider)</h3>
                                        <p className="text-sm text-gray-400 mt-1">I want to find rides, save money, and meet peers.</p>
                                    </div>
                                    {formData.role === 'rider' && <CheckCircle className="w-6 h-6 text-[#10B981]" />}
                                </div>

                                <div 
                                    onClick={() => setFormData({ ...formData, role: 'driver' })}
                                    className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-6 group hover:shadow-xl hover:scale-[1.02] ${
                                        formData.role === 'driver' 
                                            ? 'border-[#4F46E5] bg-[#4F46E5]/10 ring-1 ring-[#4F46E5]' 
                                            : 'border-[#334155] hover:border-[#4F46E5]/50 hover:bg-[#334155]/30'
                                    }`}
                                >
                                    <div className={`p-4 rounded-full ${formData.role === 'driver' ? 'bg-[#4F46E5] text-white' : 'bg-[#1E293B] text-[#94A3B8]'} transition-colors`}>
                                        <Car className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold ${formData.role === 'driver' ? 'text-[#4F46E5]' : 'text-gray-200'}`}>Sharer (Driver)</h3>
                                        <p className="text-sm text-gray-400 mt-1">I have a car and want to split costs with others.</p>
                                    </div>
                                    {formData.role === 'driver' && <CheckCircle className="w-6 h-6 text-[#4F46E5]" />}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Institutional Email</label>
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
                                    <label className="text-sm font-medium text-gray-400 ml-1">Student ID</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                                        <input
                                            name="studentId"
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                            placeholder="20XXXXXX"
                                            value={formData.studentId}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Contact Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                                        <input
                                            name="contactNumber"
                                            type="text"
                                            inputMode="tel"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                            placeholder="01XXXXXXXXX"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
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

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && formData.role === 'driver' && (
                            <motion.div
                                key="step4"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 ml-1">Make</label>
                                        <input
                                            name="vehicle.make"
                                            className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                            placeholder="Toyota"
                                            value={formData.vehicle.make}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 ml-1">Model</label>
                                        <input
                                            name="vehicle.model"
                                            className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                            placeholder="Corolla"
                                            value={formData.vehicle.model}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 ml-1">Color</label>
                                        <input
                                            name="vehicle.color"
                                            className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                            placeholder="Silver"
                                            value={formData.vehicle.color}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 ml-1">Year</label>
                                        <input
                                            name="vehicle.year"
                                            type="number"
                                            className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                            placeholder="2018"
                                            value={formData.vehicle.year}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">License Plate</label>
                                    <div className="relative group">
                                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#4F46E5] transition-colors" />
                                        <input
                                            name="vehicle.licensePlate"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                            placeholder="DHA-KA-GA-11-2233"
                                            value={formData.vehicle.licensePlate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer / Navigation */}
                <div className="mt-8 pt-6 border-t border-[#334155] flex gap-4 w-full">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-3 border border-[#334155] rounded-xl text-gray-300 font-medium hover:bg-[#334155] transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    
                    <div className="flex-1">
                        {step < totalSteps ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="w-full px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-medium shadow-lg shadow-[#10B981]/20 transition-all flex items-center justify-center gap-2"
                            >
                                Next Step <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
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
                                    <>Complete Signup <CheckCircle className="w-5 h-5" /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                </form>

                <div className="mt-6 text-center w-full">
                    <p className="text-sm text-[#94A3B8]">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-[#10B981] hover:text-[#059669] transition-colors">
                            Sign in now
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
