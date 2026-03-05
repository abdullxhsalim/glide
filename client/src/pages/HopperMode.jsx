import React, { useState } from 'react';
import { Search, MapPin, Clock, User, Star } from 'lucide-react';

const HopperMode = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const availableRides = [
    { id: 1, driver: 'Alex M.', rating: 4.8, from: 'North Campus', to: 'Downtown', time: '10:30 AM', price: '৳45', seats: 2 },
    { id: 2, driver: 'Sarah K.', rating: 4.9, from: 'Engineering Bldg', to: 'Library', time: '11:15 AM', price: '৳30', seats: 1 },
    { id: 3, driver: 'David J.', rating: 4.7, from: 'Main Gate', to: 'Subway Station', time: '12:00 PM', price: '৳50', seats: 3 },
  ];

  return (
    <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen relative z-10">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">
          Find a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#4F46E5]">Ride</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Search for available rides heading your way and hop in.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full w-full bg-[#334155]/50 border-2 border-[#334155] rounded-2xl py-4 pl-14 pr-4 text-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all shadow-lg"
            placeholder="Where do you want to go?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Ride List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#10B981]" /> Available Rides Now
          </h3>
          
          {availableRides.map((ride) => (
            <div key={ride.id} className="bg-[#334155]/30 rounded-2xl p-6 border border-[#334155] hover:border-[#10B981]/50 transition-colors flex flex-col sm:flex-row gap-6 items-center justify-between">
              
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{ride.driver}</div>
                    <div className="flex items-center text-sm text-yellow-500">
                      <Star className="w-4 h-4 fill-current mr-1" /> {ride.rating}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-gray-300 scale-95 origin-left">
                     <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400"/> {ride.from}</div>
                     <div className="w-4 h-[1px] bg-gray-500"></div>
                     <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#10B981]"/> {ride.to}</div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 bg-[#1E293B] sm:bg-transparent p-4 sm:p-0 rounded-xl">
                 <div className="text-right">
                    <div className="text-2xl font-bold text-[#10B981]">{ride.price}</div>
                    <div className="text-sm text-gray-400">{ride.time} • {ride.seats} seats left</div>
                 </div>
                 <button className="px-6 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold transition-colors">
                    Hop In
                 </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HopperMode;
