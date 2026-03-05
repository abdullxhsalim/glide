import React, { useState } from 'react';
import { Shield, MapPin, Clock, CheckCircle } from 'lucide-react';

const SharerMode = () => {
  const [isPosted, setIsPosted] = useState(false);

  return (
    <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen relative z-10">
      <div className="text-center space-y-6 mb-16">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">
          List Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#10B981]">Ride</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Post your commute, find co-riders, and split the cost of your journey.
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-[#334155]/30 p-8 rounded-3xl border border-[#334155] min-h-[400px] flex flex-col justify-center">
        {isPosted ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-24 h-24 bg-[#10B981]/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-[#10B981]" />
            </div>
            <h2 className="text-3xl font-bold text-white">Your ride is created successfully!</h2>
            <p className="text-gray-400 text-lg">Thank you for sharing your ride. We will notify you when someone hops in.</p>
            <button 
              onClick={() => setIsPosted(false)}
              className="mt-8 px-8 py-3 bg-[#334155] hover:bg-[#475569] text-white rounded-xl font-medium transition-all"
            >
              Post Another Ride
            </button>
          </div>
        ) : (
          <form className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Starting Point</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select 
                  className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>Where from?</option>
                  <option>North South University</option>
                  <option>Mirpur 10</option>
                  <option>Dhanmondi</option>
                  <option>Agargaon</option>
                  <option>Uttara</option>
                  <option>Gulshan 2</option>
                  <option>Banani</option>
                  <option>Shewrapara</option>
                  <option>Mohammadpur</option>
                  <option>Motijheel</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select 
                  className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>Where to?</option>
                  <option>North South University</option>
                  <option>Mirpur 10</option>
                  <option>Dhanmondi</option>
                  <option>Agargaon</option>
                  <option>Uttara</option>
                    <option>Gulshan 2</option>
                    <option>Banani</option>
                    <option>Shewrapara</option>
                    <option>Mohammadpur</option>
                    <option>Motijheel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Departure Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                  <select 
                    className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Select Time</option>
                    <option>08:00 AM</option>
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>12:00 PM</option>
                    <option>01:00 PM</option>
                    <option>02:00 PM</option>
                    <option>03:00 PM</option>
                    <option>04:00 PM</option>
                    <option>05:00 PM</option>
                    <option>06:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Available Seats</label>
                <select className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl px-4 text-white focus:outline-none focus:border-[#4F46E5]">
                  <option>1 Seat</option>
                  <option>2 Seats</option>
                  <option>3 Seats</option>
                  <option>4 Seats</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Toll Payment</label>
                <select className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl px-4 text-white focus:outline-none focus:border-[#4F46E5]">
                  <option>Included</option>
                  <option>Not Included</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Multiple Stoppages</label>
                <select className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl px-4 text-white focus:outline-none focus:border-[#4F46E5]">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setIsPosted(true)}
              className="w-full py-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-8"
            >
              Post Ride
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SharerMode;
