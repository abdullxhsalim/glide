import React, { useState } from 'react';
import SharerMode from './SharerMode';
import HopperMode from './HopperMode';
import { Share2, Car } from 'lucide-react';

const Dashboard = () => {
  const [activeMode, setActiveMode] = useState('hopper');

  return (
    <div className="min-h-screen bg-[#1E293B] text-[#F8FAFC] pt-28">
      {/* Toggle Controls */}
      <div className="flex justify-center mb-8 relative z-50">
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

      {activeMode === 'hopper' ? <HopperMode /> : <SharerMode />}
    </div>
  );
};

export default Dashboard;
