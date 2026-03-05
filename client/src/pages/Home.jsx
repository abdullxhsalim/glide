import React from 'react';
import { TrendingUp, Shield, Zap, CheckCircle, MapPin, Clock, Users, ArrowRight, Car, Lock } from 'lucide-react';

const Home = () => {
  return (
    <>
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-[#4F46E5]/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-[#10B981]/10 rounded-full blur-[100px]" />
        
        {/* Middle Section Blobs */}
        <div className="absolute top-[45%] left-[-10%] w-[600px] h-[600px] bg-[#10B981]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] right-[-5%] w-[500px] h-[500px] bg-[#4F46E5]/10 rounded-full blur-[100px]" />

        <div className="absolute bottom-[-5%] left-[-10%] w-[600px] h-[600px] bg-[#4F46E5]/10 rounded-full blur-[120px]" />
      </div>

      <main className="pt-24 pb-12 relative z-10">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[85vh] flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Share the Ride. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#10B981]">
                Split the Fare.
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              The exclusive carpool network for the University students community. Hop in on the way, save money, and reduce campus traffic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a href="/dash" className="px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold text-lg shadow-xl shadow-[#10B981]/25 hover:shadow-[#10B981]/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Try it Now
                <Zap className="w-5 h-5" />
              </a>
              <button className="px-8 py-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-bold text-lg shadow-xl shadow-[#4F46E5]/25 hover:shadow-[#4F46E5]/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Sign Up as a Rider
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border-2 border-[#334155] hover:border-[#4F46E5] text-[#F8FAFC] rounded-xl font-bold text-lg hover:bg-[#334155]/30 transition-all flex items-center justify-center gap-2">
                <Car className="w-5 h-5" />
                Drive & Earn
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-xl relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#4F46E5]/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative bg-[#334155] aspect-[4/5] rounded-[3rem] border-8 border-[#1E293B] shadow-2xl overflow-hidden flex items-center justify-center group">
              {/* Mock Map UI */}
              <div className="absolute inset-0 bg-[#1E293B]">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                
                {/* Route Path Graphic */}
                <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.5))' }}>
                  <path d="M100,400 Q150,300 250,250 T400,100" fill="none" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" strokeDasharray="10 10" className="animate-[dash_20s_linear_infinite]" />
                  <circle cx="100" cy="400" r="8" fill="#10B981" />
                  <circle cx="400" cy="100" r="8" fill="#4F46E5" />
                </svg>

                {/* Floating Elements */}
                <div className="absolute top-1/3 left-1/4 bg-[#334155] p-4 rounded-xl border border-[#4F46E5]/30 shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-[#10B981]">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Driver found</div>
                    <div className="font-bold text-sm">Arriving in 3m</div>
                  </div>
                </div>

                <div className="absolute bottom-1/4 right-8 bg-[#334155] p-4 rounded-xl border border-[#4F46E5]/30 shadow-xl w-48">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Total Fare</span>
                    <span className="text-[#10B981] font-bold">৳170</span>
                  </div>
                  <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-[#4F46E5] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Win-Win Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            {/* Riders Column */}
            <div className="bg-[#334155]/30 rounded-3xl p-8 lg:p-12 border border-[#334155] hover:border-[#4F46E5]/30 transition-colors">
              <div className="w-14 h-14 bg-[#4F46E5]/20 rounded-2xl flex items-center justify-center mb-8 text-[#4F46E5] mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Skip the lines, keep your cash.</h2>
              <ul className="space-y-6 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#10B981] flex-shrink-0" />
                  <span>Request a seat on an existing route instantly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#10B981] flex-shrink-0" />
                  <span>Pay a fraction of standard rideshare fares.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#10B981] flex-shrink-0" />
                  <span>Set your ride vibes: Quiet mode, AC, or Music.</span>
                </li>
              </ul>
            </div>

            {/* Sharers Column */}
            <div className="bg-[#334155]/30 rounded-3xl p-8 lg:p-12 border border-[#334155] hover:border-[#10B981]/30 transition-colors">
              <div className="w-14 h-14 bg-[#10B981]/20 rounded-2xl flex items-center justify-center mb-8 text-[#10B981] font-bold text-2xl mx-auto">
                ৳
              </div>
              <h2 className="text-3xl font-bold mb-4">Your car, your route, your rules.</h2>
              <ul className="space-y-6 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4F46E5] flex-shrink-0" />
                  <span>Set your exact route to campus.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4F46E5] flex-shrink-0" />
                  <span>Match only within your custom diversion limits.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4F46E5] flex-shrink-0" />
                  <span>Cover gas and toll costs effortlessly.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Trust & Security */}
        <section className="py-24 relative overflow-hidden">
          {/* Section-specific Ambient Background */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-[#10B981]/10 rounded-full blur-[100px]" />
             <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-[#4F46E5]/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center justify-center p-4 bg-[#10B981]/10 rounded-full mb-8">
              <Shield className="w-12 h-12 text-[#10B981]" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Verified Students Only.</h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              glide requires a <span className="text-[#F8FAFC] font-semibold">verified institutional email</span> and <span className="text-[#F8FAFC] font-semibold">valid Student ID</span> to access. You only share rides with verified peers from your university.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-[#1E293B]/60 backdrop-blur-md border border-[#334155]">
                <Lock className="w-8 h-8 text-[#4F46E5] mx-auto mb-4" />
                <h3 className="font-bold mb-2">ID Verification</h3>
                <p className="text-sm text-gray-400">Every user is manually verified before joining.</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#1E293B]/60 backdrop-blur-md border border-[#334155]">
                <Users className="w-8 h-8 text-[#10B981] mx-auto mb-4" />
                <h3 className="font-bold mb-2">Peer Network</h3>
                <p className="text-sm text-gray-400">Ride with classmates, not strangers.</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#1E293B]/60 backdrop-blur-md border border-[#334155]">
                <TrendingUp className="w-8 h-8 text-[#F8FAFC] mx-auto mb-4" />
                <h3 className="font-bold mb-2">Community Rated</h3>
                <p className="text-sm text-gray-400">Mutual rating system keeps standards high.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#334155] to-[#1E293B] border border-[#334155] hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-[#4F46E5] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-[#4F46E5]/20 mx-auto">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Routing</h3>
              <p className="text-gray-400">Set your maximum diversion limit and we handle the math to find the perfect match.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#334155] to-[#1E293B] border border-[#334155] hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-[#10B981]/20 mx-auto">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Expressway Ready</h3>
              <p className="text-gray-400">Toggle tolls on to automatically split fees among all passengers.</p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#334155] to-[#1E293B] border border-[#334155] hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-[#F8FAFC] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-white/10 font-bold text-lg text-[#1E293B] mx-auto">
                ৳
              </div>
              <h3 className="text-xl font-bold mb-3">Cashless & Fair</h3>
              <p className="text-gray-400">Secure automated payments ensure fair splitting of all ride costs instantly.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;