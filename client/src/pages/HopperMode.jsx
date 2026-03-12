import React, { useState } from 'react';
import { Search, MapPin, Clock, User, Star } from 'lucide-react';

const HopperMode = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerLocation, setPartnerLocation] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const partnerLocations = [
    'Banani', 'Gulshan 1', 'Gulshan 2', 'Dhanmondi',
    'Farmgate', 'Mirpur 10', 'Mohakhali', 'Uttara', 'Bashundhara'
  ];

  const handleSendRequest = () => {
    if (partnerLocation) {
      setRequestSent(true);
      setTimeout(() => {
        setRequestSent(false);
        setShowPartnerForm(false);
        setPartnerLocation('');
      }, 3000); // Reset form after 3 seconds
    }
  };

  const availableRides = [
    { id: 1, driver: 'Rahim U.', rating: 4.8, from: 'Banani', to: 'Gulshan 2', time: '10:30 AM', price: '৳45', seats: 2 },
    { id: 2, driver: 'Sadia M.', rating: 4.9, from: 'Dhanmondi 27', to: 'Farmgate', time: '11:15 AM', price: '৳30', seats: 1 },
    { id: 3, driver: 'Kamrul H.', rating: 4.7, from: 'Mirpur 10', to: 'Mohakhali', time: '12:00 PM', price: '৳50', seats: 3 },
  ];

  return (
    <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col w-full relative z-10">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">
          Find a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#4F46E5]">Ride</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Search for available rides heading your way and hop in.
        </p>
      </div>

      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col">
        {/* Search Bar */}
        <div className="relative mb-8">
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

        {/* Can't find a ride */}
        <div className="mb-8 bg-gradient-to-r from-[#334155]/60 to-[#1E293B]/60 p-8 rounded-3xl border border-gray-700/50 text-center flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-3">Can't find any suitable rides?</h3>
          <p className="text-gray-400 mb-6 max-w-md">
            Don't worry! You can find a partner going to the same destination and split the ride together.
          </p>

          {requestSent ? (
            <div className="text-[#10B981] font-bold text-xl py-3 flex items-center gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center">✓</div>
              Request Sent Successfully!
            </div>
          ) : showPartnerForm ? (
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <select
                value={partnerLocation}
                onChange={(e) => setPartnerLocation(e.target.value)}
                className="flex-1 bg-[#1E293B] border border-[#4F46E5]/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                <option value="" disabled>Select destination</option>
                {partnerLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <button
                onClick={handleSendRequest}
                disabled={!partnerLocation}
                className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
              >
                Send Request
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPartnerForm(true)}
              className="px-8 py-3 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Find Partner
            </button>
          )}
        </div>

        {/* Ride List */}
        <div className="space-y-4 mb-4">
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
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400" /> {ride.from}</div>
                  <div className="w-4 h-[1px] bg-gray-500"></div>
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#10B981]" /> {ride.to}</div>
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
