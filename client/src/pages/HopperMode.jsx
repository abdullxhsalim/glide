import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, User, Star, Loader, ArrowRight, Calendar } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import RouteMap from '../components/RouteMap';
import GoogleLocationInput from '../components/GoogleLocationInput';
import { getRouteDetails } from '../utils/rideCalculator';

const LIBRARIES = ['places', 'geometry'];

const HopperMode = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true); // Initial load for rides
  const [calculating, setCalculating] = useState(false); // Route calculation
  const [error, setError] = useState(null);

  // New location states
  const [originLocation, setOriginLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);
  const [rideMetrics, setRideMetrics] = useState({
    distanceKm: 0,
    durationMin: 0,
    routeGeometry: null
  });

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token;

        if (!token) {
           setError('Please login to view rides');
           setLoading(false);
           return;
        }

        const res = await fetch('/api/rides', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch rides');
        }

        const data = await res.json();
        setRides(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePlaceSelected = (field, placeData) => {
      if (field === 'origin') setOriginLocation(placeData);
      if (field === 'destination') setDestLocation(placeData);
  };

  const calculateRoute = useCallback(async () => {
    if (!originLocation || !destLocation) return;
    
    setCalculating(true);
    try {
      const originCoords = [originLocation.lng, originLocation.lat];
      const destCoords = [destLocation.lng, destLocation.lat];

      const routeData = await getRouteDetails(originCoords, destCoords);
      
      if (routeData) {
        setRideMetrics({
            distanceKm: (routeData.distanceMeter / 1000).toFixed(1),
            durationMin: Math.round(routeData.durationSeconds / 60),
            routeGeometry: routeData.geometry
        });
      }
    } catch (err) {
      console.error("Route calculation error", err);
    } finally {
      setCalculating(false);
    }
  }, [originLocation, destLocation]);

  useEffect(() => {
    if (originLocation && destLocation) {
        calculateRoute();
    }
  }, [originLocation, destLocation, calculateRoute]);


  if (!isLoaded) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen relative z-10 text-[#F8FAFC]">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">
          Find a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#10B981]">Ride</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Search for available rides, join a carpool, and travel comfortably.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Search & Map Panel (Styled like Sharer Mode) */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#334155]/20 backdrop-blur-sm p-6 rounded-3xl border border-[#334155] shadow-2xl relative">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                    <MapPin className="text-[#4F46E5]" /> 
                    Plan Journey
                </h2>
                
                <div className="space-y-5">
                    <div className="space-y-4">
                        <GoogleLocationInput
                            label="Pickup Location"
                            isLoaded={isLoaded}
                            onPlaceSelected={(place) => handlePlaceSelected('origin', place)}
                            placeholder="Enter pickup location"
                            icon={MapPin}
                        />
                        
                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-[#1E293B] p-2 rounded-full border border-[#334155] text-gray-400">
                                <ArrowRight className="w-4 h-4 rotate-90" />
                            </div>
                        </div>

                        <GoogleLocationInput
                            label="Dropoff Location"
                            isLoaded={isLoaded}
                            onPlaceSelected={(place) => handlePlaceSelected('destination', place)}
                            placeholder="Enter destination"
                            icon={MapPin}
                        />
                    </div>

                    {rideMetrics.distanceKm > 0 && (
                        <div className="p-4 bg-[#1E293B]/80 rounded-xl border border-[#334155] flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Distance</p>
                                <p className="text-lg font-bold text-white">{rideMetrics.distanceKm} km</p>
                            </div>
                            <div className="h-8 w-px bg-[#334155]"></div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Est. Time</p>
                                <p className="text-lg font-bold text-white">{rideMetrics.durationMin} min</p>
                            </div>
                        </div>
                    )}

                    <div className="h-64 w-full rounded-2xl overflow-hidden border border-[#334155] shadow-inner relative mt-4">
                        <RouteMap 
                            isLoaded={isLoaded}
                            origin={originLocation ? [originLocation.lng, originLocation.lat] : null}
                            destination={destLocation ? [destLocation.lng, destLocation.lat] : null}
                            geometry={rideMetrics.routeGeometry}
                        />
                        {calculating && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader className="w-8 h-8 text-[#4F46E5] animate-spin" />
                                    <span className="text-sm font-medium text-white">Calculating...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button className="w-full py-4 bg-gradient-to-r from-[#4F46E5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#4F46E5]/25 flex items-center justify-center gap-2 text-lg">
                        <Search className="w-5 h-5" />
                        Search Rides
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column: Results List */}
        <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    Available Rides
                    <span className="bg-[#334155] text-white px-3 py-1 rounded-full text-xs">{rides.length}</span>
                </h2>
                <div className="flex gap-2">
                    {/* Filter buttons could go here */}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader className="w-10 h-10 text-[#4F46E5] animate-spin" />
                    <p className="text-gray-400">Loading available rides...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl flex items-center justify-center">
                    {error}
                </div>
            ) : rides.length === 0 ? (
                <div className="text-center py-20 bg-[#334155]/20 rounded-3xl border border-[#334155] border-dashed">
                    <div className="w-16 h-16 bg-[#334155] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No rides found</h3>
                    <p className="text-gray-400">Try adjusting your search criteria or check back later.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rides.map(ride => (
                        <div key={ride._id} className="bg-[#334155]/20 backdrop-blur-sm p-6 rounded-2xl border border-[#334155] hover:border-[#4F46E5]/50 hover:bg-[#334155]/30 transition-all cursor-pointer group">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#10B981] flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-[#1E293B]">
                                                {ride.host?.name?.charAt(0) || <User className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-[#4F46E5] transition-colors">{ride.host?.name || 'Verified Driver'}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    <span>4.9</span>
                                                    <span className="text-gray-500">• 12 trips</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right md:hidden">
                                            <p className="text-2xl font-bold text-[#10B981]">৳{Math.round(ride.totalFuelCost / (ride.seatsTotal + 1))}</p>
                                        </div>
                                    </div>

                                    <div className="relative pl-6 space-y-6 border-l-2 border-[#334155] ml-2.5 my-4">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#4F46E5] ring-4 ring-[#1E293B]"></div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pickup</p>
                                            <p className="text-white font-medium text-base truncate pr-4">{ride.origin?.address || 'Unknown Origin'}</p>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#10B981] ring-4 ring-[#1E293B]"></div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Dropoff</p>
                                            <p className="text-white font-medium text-base truncate pr-4">{ride.destination?.address || 'Unknown Destination'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-sm text-gray-300">
                                            <Calendar className="w-4 h-4 text-[#4F46E5]" />
                                            {new Date(ride.departureTime).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-sm text-gray-300">
                                            <Clock className="w-4 h-4 text-[#10B981]" />
                                            {formatTime(ride.departureTime)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-[#334155] pt-4 md:pt-0 md:pl-6">
                                    <div className="hidden md:block text-right">
                                        <p className="text-4xl font-bold text-[#10B981]">৳{Math.round(ride.totalFuelCost / (ride.seatsTotal + 1))}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-1">per seat</p>
                                    </div>
                                    
                                    <button className="w-full md:w-auto mt-4 px-6 py-3 bg-[#334155] hover:bg-[#4F46E5] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-[#4F46E5]/25">
                                        Book Seat
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HopperMode;
