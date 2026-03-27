import React, { useState } from 'react';
import SharerMode from './SharerMode';
import HopperMode from './HopperMode';
import Footer from '../components/Footer';
import { Share2, Car } from 'lucide-react';

const Dashboard = () => {
  const [activeMode, setActiveMode] = useState('hopper');
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#1E293B] text-[#F8FAFC]">
      
      {/* Header Section (Fixed) */}
      <div className="pt-24 pb-2 px-4 flex-shrink-0 z-40 bg-[#1E293B]">
        {/* Welcome & Time Display */}
        <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">
              {getGreeting()}, <span className="text-[#10B981]">{user?.name || 'Traveler'}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-2">
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
              <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex justify-center mb-4 relative z-50">
          <div className="bg-[#334155]/80 backdrop-blur-md p-1.5 rounded-full border border-gray-700 shadow-xl flex items-center w-72 relative transition-all duration-300">

            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-300 ease-in-out z-0 
                ${activeMode === 'hopper' ? 'left-1.5 bg-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'left-[50%] bg-[#4F46E5] shadow-[0_0_15px_rgba(79,70,229,0.4)]'}`}
            />

            <button
              onClick={() => setActiveMode('hopper')}
              className={`flex-1 py-2.5 rounded-full z-10 font-bold flex items-center justify-center gap-2 text-sm transition-colors
                ${activeMode === 'hopper' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Car className="w-4 h-4" />
              Hopper
            </button>

            <button
              onClick={() => setActiveMode('sharer')}
              className={`flex-1 py-2.5 rounded-full z-10 font-bold flex items-center justify-center gap-2 text-sm transition-colors
                ${activeMode === 'sharer' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Share2 className="w-4 h-4" />
              Sharer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden pb-0">
         {activeMode === 'hopper' ? (
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col">
               <div className="flex-grow">
                 <HopperMode />
               </div>
               <Footer />
            </div>
         ) : (
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col">
               <div className="flex-grow pb-10">
                 <SharerMode />
               </div>
               <Footer />
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;
