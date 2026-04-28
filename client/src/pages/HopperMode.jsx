import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Star, Loader, ArrowRight, ArrowLeft, Calendar, Car, Navigation, ShieldCheck } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import RouteMap from '../components/RouteMap';
import GoogleLocationInput from '../components/GoogleLocationInput';

const LIBRARIES = ['places', 'geometry'];

const HopperMode = () => {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries: LIBRARIES });

  // Core Request State
  const [originLocation, setOriginLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);
  const [seats, setSeats] = useState(1);
  const [rideType, setRideType] = useState('now'); // 'now' or 'schedule'
  
  // Date/Time specifically for scheduled
  const [date, setDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [timeParts, setTimeParts] = useState({ hour: '12', minute: '00', period: 'PM' });

  // UI State
  const [view, setView] = useState('request'); // request, matching, success, my_bookings
  const [error, setError] = useState(null);
  const [matchedBooking, setMatchedBooking] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      if (!token) return;
      const res = await fetch('/api/bookings/mine', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setMyBookings(data);
    } catch (err) { console.error('Failed to load bookings'); } finally { setLoadingBookings(false); }
  };

  useEffect(() => {
    if (view === 'my_bookings') fetchMyBookings();
  }, [view]);

  const handleRequestRide = async () => {
    const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
    if (!token) { setError('Please login to request rides'); return; }
    if (!originLocation?.lat || !destLocation?.lat) { setError('Please select valid pickup and dropoff points from the dropdown.'); return; }
    
    setError(null);
    setView('matching');
    
    const formattedTime = `${timeParts.hour}:${timeParts.minute} ${timeParts.period}`;

    try {
      const res = await fetch('/api/bookings/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pickupLat: originLocation.lat, pickupLng: originLocation.lng,
          dropoffLat: destLocation.lat, dropoffLng: destLocation.lng,
          pickupAddress: originLocation.placeName, dropoffAddress: destLocation.placeName,
          date, time: formattedTime, seatsBooked: seats, type: rideType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No drivers available right now.');
      
      setMatchedBooking(data.booking);
      setView('success');
    } catch (err) {
      setError(err.message);
      setView('request'); // go back to request screen with error
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-[#10B981] bg-[#10B981]/15';
      case 'rejected': case 'cancelled': return 'text-[#EF4444] bg-[#EF4444]/15';
      default: return 'text-amber-500 bg-amber-500/15'; // pending
    }
  };

  if (!isLoaded) return <div className="h-[60vh] flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-[#10B981]" /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-full flex-1 w-full overflow-hidden border-t border-[#334155]">
      {/* Left Panel - UI Controller */}
      <div className="w-full lg:w-[400px] lg:shrink-0 bg-[#0F172A] border-r border-[#334155] flex flex-col z-10 shadow-2xl overflow-y-auto">
        <div className="p-4 border-b border-[#334155] flex justify-between items-center bg-[#1E293B]/50 backdrop-blur-md sticky top-0">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <Navigation className="w-6 h-6 text-[#10B981]" /> Hopper
           </h2>
           <button onClick={() => setView('my_bookings')} className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors">My Rides</button>
        </div>

        <div className="flex-1 p-6 relative">
          {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">{error}</div>}

          {view === 'request' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
               <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Where to?</h3>
                  <p className="text-[#94A3B8] text-sm">We'll algorithmically find the best driver heading your way.</p>
               </div>
               
               <div className="relative space-y-4 bg-[#1E293B]/40 p-4 rounded-2xl border border-[#334155]">
                  <div className="absolute left-6 top-[28px] bottom-[28px] w-0.5 bg-[#334155] z-0 hidden sm:block"></div>
                  
                  <div className="relative z-10">
                    <GoogleLocationInput label="Pickup Location" placeholder="Where are you now?" icon={<div className="w-3 h-3 rounded-full bg-[#10B981] absolute left-3 top-3"></div>} onLocationSelect={(loc) => setOriginLocation(loc)} />
                  </div>
                  <div className="relative z-10">
                    <GoogleLocationInput label="Dropoff Location" placeholder="Where are you going?" icon={<div className="w-3 h-3 rounded-sm bg-[#EF4444] absolute left-3 top-3"></div>} onLocationSelect={(loc) => setDestLocation(loc)} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setRideType('now')} className={`p-4 rounded-xl border text-center transition-all ${rideType === 'now' ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]' : 'bg-[#1E293B]/40 border-[#334155] text-[#94A3B8] hover:border-[#475569]'}`}>
                    <Clock className="w-6 h-6 mx-auto mb-2" /> <span className="font-semibold">Leave Now</span>
                  </button>
                  <button onClick={() => setRideType('schedule')} className={`p-4 rounded-xl border text-center transition-all ${rideType === 'schedule' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]' : 'bg-[#1E293B]/40 border-[#334155] text-[#94A3B8] hover:border-[#475569]'}`}>
                    <Calendar className="w-6 h-6 mx-auto mb-2" /> <span className="font-semibold">Schedule</span>
                  </button>
               </div>

               {rideType === 'schedule' && (
                 <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white focus:border-[#10B981] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider">Time</label>
                      <div className="flex bg-[#0F172A] border border-[#334155] rounded-xl overflow-hidden focus-within:border-[#10B981]">
                        <input type="text" maxLength="2" value={timeParts.hour} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val === '' || (parseInt(val) <= 12)) setTimeParts(prev => ({...prev, hour: val})) }} className="w-12 bg-transparent text-center text-white outline-none pl-2" />
                        <span className="text-white py-3">:</span>
                        <input type="text" maxLength="2" value={timeParts.minute} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val === '' || (parseInt(val) < 60)) setTimeParts(prev => ({...prev, minute: val})) }} className="w-12 bg-transparent text-center text-white outline-none" />
                        <select value={timeParts.period} onChange={e => setTimeParts(prev => ({...prev, period: e.target.value}))} className="bg-[#1E293B] text-[#94A3B8] font-bold outline-none px-2 cursor-pointer border-l border-[#334155]">
                           <option>AM</option><option>PM</option>
                        </select>
                      </div>
                    </div>
                 </div>
               )}

               <div>
                 <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">Seats Needed</label>
                 <div className="flex bg-[#1E293B]/40 border border-[#334155] rounded-xl p-1">
                    {[1, 2, 3, 4].map(num => (
                      <button key={num} onClick={() => setSeats(num)} className={`flex-1 py-2 font-bold rounded-lg transition-colors ${seats === num ? 'bg-[#10B981] text-white shadow-md' : 'text-[#64748B] hover:text-white'}`}>{num}</button>
                    ))}
                 </div>
               </div>

               <button onClick={handleRequestRide} className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#10B981]/25 flex items-center justify-center gap-2 group transition-all">
                  Request Ride <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          )}

          {view === 'matching' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
               <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-[#10B981]/20 border-t-[#10B981] animate-spin"></div>
                  <Navigation className="w-8 h-8 text-[#10B981] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-white mb-2">Finding your ride...</h3>
                 <p className="text-[#94A3B8]">Matching you with the best driver on route.</p>
               </div>
               <button onClick={() => setView('request')} className="px-6 py-2 rounded-full border border-[#334155] text-[#94A3B8] hover:text-white hover:border-[#475569] transition-colors mt-8">Cancel</button>
            </div>
          )}

          {view === 'success' && matchedBooking && (
             <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
                <div className="p-6 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-center">
                  <div className="w-16 h-16 bg-[#10B981] rounded-full mx-auto flex items-center justify-center shadow-lg shadow-[#10B981]/40 mb-4">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Match Confirmed!</h3>
                  <p className="text-[#94A3B8] text-sm">Your booking request has been sent to the driver.</p>
                  <div className="mt-4 inline-flex px-3 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-xs font-bold uppercase tracking-wider">Status: Pending Driver Approval</div>
                </div>

                <div className="bg-[#1E293B]/60 p-5 rounded-2xl border border-[#334155]">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#334155]">
                    <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-full flex items-center justify-center text-[#3B82F6] font-bold text-lg border border-[#3B82F6]/30">
                       {matchedBooking.driver?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{matchedBooking.driver?.name}</h4>
                      <p className="text-xs text-[#94A3B8] flex items-center gap-1"><Star className="w-3 h-3 text-[#F59E0B]" /> {matchedBooking.driver?.rating || 'New Driver'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-[#64748B]">Vehicle</span>
                        <span className="text-white font-medium">{matchedBooking.driver?.vehicleModel}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-[#64748B]">Plate Number</span>
                        <span className="text-white font-medium">{matchedBooking.driver?.vehiclePlate || 'Hidden until accepted'}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-[#64748B]">Expected Fare</span>
                        <span className="text-[#10B981] font-bold text-lg">৳{matchedBooking.tripPrice}</span>
                     </div>
                  </div>
                </div>

                <button onClick={() => setView('my_bookings')} className="w-full py-4 rounded-xl font-bold text-white border border-[#334155] hover:bg-[#1E293B] transition-colors">View My Bookings</button>
             </div>
          )}

          {view === 'my_bookings' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
               <button onClick={() => setView('request')} className="flex items-center gap-2 text-[#94A3B8] hover:text-white font-medium text-sm mb-4"><ArrowLeft className="w-4 h-4"/> Back to Rides</button>
               
               {loadingBookings ? (
                  <div className="py-12 flex justify-center"><Loader className="w-6 h-6 animate-spin text-[#10B981]" /></div>
               ) : myBookings.length === 0 ? (
                  <div className="py-12 text-center text-[#64748B]">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>No active ride bookings found.</p>
                  </div>
               ) : (
                  myBookings.map(b => (
                     <div key={b._id} className="p-4 rounded-xl bg-[#1E293B]/60 border border-[#334155] space-y-3 hover:border-[#475569] transition-colors">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Departure</p>
                              <p className="text-white font-medium">{new Date(b.dateTime).toLocaleString()}</p>
                           </div>
                           <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${getStatusColor(b.status)}`}>{b.status}</span>
                        </div>
                        <div className="space-y-1 my-3 bg-[#0F172A] p-3 rounded-lg text-sm border border-[#334155]">
                           <p className="text-white truncate flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0"/> {b.pickupLocation?.address || 'Origin'}</p>
                           <p className="text-white truncate flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0"/> {b.dropoffLocation?.address || 'Destination'}</p>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-[#334155]">
                           <span className="text-[#94A3B8]">{b.driver?.name} • {b.seatsBooked} Seat{b.seatsBooked > 1 && 's'}</span>
                           <span className="font-bold text-[#10B981]">৳{b.tripPrice}</span>
                        </div>
                     </div>
                  ))
               )}
             </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#1E293B] relative min-h-full h-full">
         {(originLocation || destLocation) ? (
            <div className="absolute inset-0 w-full h-full">
              <RouteMap origin={originLocation ? [originLocation.lng, originLocation.lat] : null} destination={destLocation ? [destLocation.lng, destLocation.lat] : null} isLoaded={isLoaded} />
            </div>
         ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40 bg-[#0F172A]">
               <MapPin className="w-16 h-16 text-[#94A3B8] mb-4" />
               <h2 className="text-2xl font-bold text-[#94A3B8]">Select Pickup & Dropoff</h2>
               <p className="text-[#64748B]">The map will automatically route your trip.</p>
            </div>
         )}
         
         {/* Map overlay gradient */}
         <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1E293B] to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
};

export default HopperMode;
