import React from 'react';
import { Shield, MapPin, Clock } from 'lucide-react';

const SharerMode = () => {
  return (
    <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen relative z-10">
      <div className="text-center space-y-6 mb-16">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">
          List Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#10B981]">Ride</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Post your commute, find co-riders, and split the cost of your journey.
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-[#334155]/30 p-8 rounded-3xl border border-[#334155]">
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Starting Point</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5]"
                  placeholder="Where from?"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5]"
                  placeholder="Where to?"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Departure Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="time" 
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Available Seats</label>
                <select className="w-full bg-[#1E293B] border border-[#334155] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#4F46E5]">
                  <option>1 Seat</option>
                  <option>2 Seats</option>
                  <option>3 Seats</option>
                  <option>4 Seats</option>
                </select>
              </div>
            </div>
          </div>

          <button type="button" className="w-full py-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-8">
            Post Ride
          </button>
        </form>
      </div>
    </div>
  );
};

export default SharerMode;
