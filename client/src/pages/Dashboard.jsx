import React, { useState } from 'react';
import SharerMode from './SharerMode';
import HopperMode from './HopperMode';
import Footer from '../components/Footer';
import { Share2, Car } from 'lucide-react';

const Dashboard = () => {
  const [activeMode, setActiveMode] = useState('hopper');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
  const [showVerifyVehicle, setShowVerifyVehicle] = useState(false);
  const [verifyingVehicle, setVerifyingVehicle] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    color: '',
    licensePlate: '',
    year: ''
  });

  const handleSharerClick = () => {
    if (user?.role === 'driver') {
      setShowVerifyVehicle(false);
      setVerifyError('');
      setActiveMode('sharer');
      return;
    }

    setActiveMode('sharer');
    setShowVerifyVehicle(true);
  };

  const handleVerifyVehicle = async (e) => {
    e.preventDefault();
    setVerifyError('');

    try {
      const token = user?.token;
      if (!token) {
        throw new Error('Please login again and try verifying your vehicle.');
      }

      setVerifyingVehicle(true);

      const response = await fetch('/api/users/verify-vehicle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...vehicleForm,
          year: vehicleForm.year ? Number(vehicleForm.year) : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Vehicle verification failed');
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      setShowVerifyVehicle(false);
      setActiveMode('sharer');
    } catch (error) {
      setVerifyError(error.message || 'Vehicle verification failed');
    } finally {
      setVerifyingVehicle(false);
    }
  };

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
              onClick={() => {
                setActiveMode('hopper');
                setShowVerifyVehicle(false);
                setVerifyError('');
              }}
              className={`flex-1 py-2.5 rounded-full z-10 font-bold flex items-center justify-center gap-2 text-sm transition-colors
                ${activeMode === 'hopper' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Car className="w-4 h-4" />
              Hopper
            </button>

            <button
              onClick={handleSharerClick}
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
         ) : showVerifyVehicle ? (
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col">
               <div className="flex-grow pb-10 px-4 sm:px-6 lg:px-8">
                 <div className="max-w-3xl mx-auto bg-[#334155]/30 border border-[#334155] rounded-3xl p-8 mt-6">
                   <h2 className="text-3xl font-bold text-white mb-2">Get Your Vehicle Verified</h2>
                   <p className="text-gray-400 mb-6">You are currently a hopper. Verify your vehicle to become a sharer and publish rides.</p>

                   {verifyError && (
                     <div className="mb-5 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
                       {verifyError}
                     </div>
                   )}

                   <form onSubmit={handleVerifyVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs text-gray-400 mb-1">Vehicle Make</label>
                       <input
                         type="text"
                         placeholder="Toyota"
                         value={vehicleForm.make}
                         onChange={(e) => setVehicleForm((prev) => ({ ...prev, make: e.target.value }))}
                         required
                         className="w-full h-11 bg-[#1E293B] border border-[#334155] rounded-lg px-3 text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-gray-400 mb-1">Vehicle Model</label>
                       <input
                         type="text"
                         placeholder="Axio"
                         value={vehicleForm.model}
                         onChange={(e) => setVehicleForm((prev) => ({ ...prev, model: e.target.value }))}
                         required
                         className="w-full h-11 bg-[#1E293B] border border-[#334155] rounded-lg px-3 text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-gray-400 mb-1">Color</label>
                       <input
                         type="text"
                         placeholder="White"
                         value={vehicleForm.color}
                         onChange={(e) => setVehicleForm((prev) => ({ ...prev, color: e.target.value }))}
                         required
                         className="w-full h-11 bg-[#1E293B] border border-[#334155] rounded-lg px-3 text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-gray-400 mb-1">License Plate</label>
                       <input
                         type="text"
                         placeholder="Dhaka Metro Ga-123456"
                         value={vehicleForm.licensePlate}
                         onChange={(e) => setVehicleForm((prev) => ({ ...prev, licensePlate: e.target.value }))}
                         required
                         className="w-full h-11 bg-[#1E293B] border border-[#334155] rounded-lg px-3 text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-gray-400 mb-1">Year (Optional)</label>
                       <input
                         type="number"
                         placeholder="2020"
                         value={vehicleForm.year}
                         onChange={(e) => setVehicleForm((prev) => ({ ...prev, year: e.target.value }))}
                         className="w-full h-11 bg-[#1E293B] border border-[#334155] rounded-lg px-3 text-white"
                       />
                     </div>
                     <div className="md:col-span-2 pt-2">
                       <button
                         type="submit"
                         disabled={verifyingVehicle}
                         className="w-full h-11 bg-[#10B981] hover:bg-[#059669] rounded-lg text-white font-semibold disabled:opacity-60"
                       >
                         {verifyingVehicle ? 'Verifying...' : 'Get your vehicle verified'}
                       </button>
                     </div>
                   </form>
                 </div>
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
