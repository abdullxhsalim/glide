import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, User, Star, Loader, ArrowRight, Calendar, Locate } from 'lucide-react';
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
  const [loading, setLoading] = useState(false); // Initial load for rides
  const [hasSearched, setHasSearched] = useState(false);
  const [calculating, setCalculating] = useState(false); // Route calculation
  const [error, setError] = useState(null);

  const [originLocation, setOriginLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [pickupFilterText, setPickupFilterText] = useState('');
  const [dropoffFilterText, setDropoffFilterText] = useState('');
  const [showRideListOnly, setShowRideListOnly] = useState(false);
  
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [time, setTime] = useState('');

  const [rideMetrics, setRideMetrics] = useState({
    distanceKm: 0,
    durationMin: 0,
    routeGeometry: null
  });


  const fetchRides = async (searchParams = {}) => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
         setError('Please login to view rides');
         setLoading(false);
         return;
      }

      let url = '/api/rides';
      const queryParams = {};

      // Optional map-based filtering
      if (searchParams.origin && searchParams.destination) {
        queryParams.pickupLat = searchParams.origin.lat;
        queryParams.pickupLng = searchParams.origin.lng;
        queryParams.dropoffLat = searchParams.destination.lat;
        queryParams.dropoffLng = searchParams.destination.lng;
      }

      // Active rides from selected date/time (inclusive)
      if (searchParams.date) {
        const [y, m, d] = searchParams.date.split('-').map(Number);
        const startD = new Date(y, m - 1, d, 0, 0, 0, 0);

        if (searchParams.time) {
          const [hm, amph] = searchParams.time.split(' ');
          if (hm && amph) {
            let [h, min] = hm.split(':').map(Number);
            if (amph === 'PM' && h !== 12) h += 12;
            if (amph === 'AM' && h === 12) h = 0;
            startD.setHours(h, min, 0, 0);
          }
        }

        queryParams.minDepartureTime = startD.toISOString();
      }

      const params = new URLSearchParams(queryParams);
      if ([...params.keys()].length > 0) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
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

  const handleInputChange = (field, value) => {
    if (field === 'origin') {
        setOriginInput(value);
        if (value === '') setOriginLocation(null);
    }
    if (field === 'destination') {
        setDestInput(value);
        if (value === '') setDestLocation(null);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (!window.google) return;
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              const place = {
                  address,
                  lat,
                  lng,
                  place_id: results[0].place_id
              };
              setOriginLocation(place);
              setOriginInput(address);
            }
          });
        },
        () => {
          alert("Unable to retrieve your location");
        }
      );
    } else {
        alert("Geolocation is not supported by your browser");
    }
  };

  const handlePlaceSelected = (field, placeData) => {
      if (field === 'origin') {
        setOriginLocation(placeData);
        setOriginInput(placeData.address);
      }
      if (field === 'destination') {
        setDestLocation(placeData);
        setDestInput(placeData.address);
      }
  };

  const handleMapClick = (e) => {
      if (!isLoaded || !window.google) return;
      
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              const place = {
                  address,
                  lat,
                  lng,
                  place_id: results[0].place_id
              };
              
              if (!originLocation) {
                  setOriginLocation(place);
                  setOriginInput(address);
              } else {
                  setDestLocation(place);
                  setDestInput(address);
              }
          }
      });
  };

  const handleSearch = () => {
      if (!originLocation || !destLocation || !date) {
          setError("Please select Pickup, Dropoff locations and Date");
          return;
      }
      fetchRides({ origin: originLocation, destination: destLocation, date, time });
  };

  const handleFindActiveRides = () => {
    if (!date) {
      setError('Please select a date first');
      return;
    }
    setShowRideListOnly(true);
    fetchRides({ date, time });
  };

  const handleShowMap = () => {
    setShowRideListOnly(false);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const filteredRides = rides.filter((ride) => {
    const ridePickup = `${ride.origin?.placeName || ''} ${ride.origin?.address || ''}`.toLowerCase();
    const rideDropoff = `${ride.destination?.placeName || ''} ${ride.destination?.address || ''}`.toLowerCase();
    const pickupText = pickupFilterText.trim().toLowerCase();
    const dropoffText = dropoffFilterText.trim().toLowerCase();

    const pickupMatches = !pickupText || ridePickup.includes(pickupText);
    const dropoffMatches = !dropoffText || rideDropoff.includes(dropoffText);

    return pickupMatches && dropoffMatches;
  });

  if (!isLoaded) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-24 sm:pt-32 relative z-10 transition-colors duration-300">
        
        {/* Header Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl mb-6 tracking-tight">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#10B981]">Perfect Ride</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
              Enter your route to compare prices and find verified drivers heading your way.
            </p>
        </div>

        {/* Search Card */}
        <div className="max-w-2xl mx-auto bg-[#334155]/30 backdrop-blur-xl rounded-3xl p-8 border border-[#334155] shadow-2xl relative overflow-hidden transition-all duration-300">
            
            <div className="space-y-6">
                <button
                  onClick={handleFindActiveRides}
                  disabled={loading || calculating || !date}
                  className="w-full py-4 bg-gradient-to-r from-[#4F46E5] to-[#10B981] hover:from-[#4338ca] hover:to-[#059669] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#4F46E5]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  See All Active Rides
                </button>

                {showRideListOnly && (
                  <button
                    onClick={handleShowMap}
                    className="w-full py-3 bg-[#1E293B] border border-[#334155] hover:border-[#4F46E5] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    Show Map
                  </button>
                )}

                {!showRideListOnly && (
                  <>
                {/* Inputs */}
                <div className="grid grid-cols-1 gap-5">
                    <div className="flex gap-2 items-end">
                        <div className="flex-grow">
                             <GoogleLocationInput
                                label="Starting Point"
                                value={originInput}
                                onChange={(val) => handleInputChange('origin', val)}
                                onPlaceSelected={(place) => handlePlaceSelected('origin', place)}
                                isLoaded={isLoaded}
                                placeholder="Search starting point..."
                                icon={MapPin}
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleUseMyLocation}
                            className="bg-[#1E293B] border border-[#334155] h-[52px] w-[52px] rounded-xl flex items-center justify-center hover:bg-[#334155] hover:border-[#4F46E5] transition-all mb-[1px]"
                            title="Use Current Location"
                        >
                            <Locate className="text-[#4F46E5] w-5 h-5" />
                        </button>
                    </div>
                    
                    <div>
                        <GoogleLocationInput
                            label="Destination"
                            value={destInput}
                            onChange={(val) => handleInputChange('destination', val)}
                            onPlaceSelected={(place) => handlePlaceSelected('destination', place)}
                            isLoaded={isLoaded}
                            placeholder="Search destination..."
                            icon={MapPin}
                        />
                    </div>
                </div>

                {/* Date & Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Time (Optional)</label>
                            <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <select 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] appearance-none transition-all"
                            >
                                <option value="">Any Time</option>
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
                                <option>07:00 PM</option>
                                <option>08:00 PM</option>
                            </select>
                            </div>
                    </div>
                </div>

                {/* Map Preview */}
                <div className="rounded-xl overflow-hidden border border-[#334155] h-[300px] relative">
                     <div className="absolute top-4 right-4 z-10 bg-[#1E293B]/80 backdrop-blur px-3 py-1 rounded-full border border-[#334155] text-xs text-gray-300">
                        { !originLocation ? "Click map to set Origin" : !destLocation ? "Click map to set Destination" : "Route Preview"}
                    </div>
                    <RouteMap 
                      origin={originLocation ? [originLocation.lng, originLocation.lat] : null}
                      destination={destLocation ? [destLocation.lng, destLocation.lat] : null}
                      geometry={rideMetrics.routeGeometry}
                      isLoaded={isLoaded}
                      onMapClick={handleMapClick}
                    />
                </div>
                
                 {/* Metrics Display */}
                 {rideMetrics.distanceKm > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Total Distance</p>
                            <p className="text-white font-bold text-xl">{rideMetrics.distanceKm} km</p>
                         </div>
                         <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Est. Duration</p>
                            <p className="text-white font-bold text-xl">{rideMetrics.durationMin} min</p>
                         </div>
                    </div>
                 )}

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={loading || calculating || !originLocation || !destLocation}
                    className="w-full py-4 bg-gradient-to-r from-[#4F46E5] to-[#10B981] hover:from-[#4338ca] hover:to-[#059669] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#4F46E5]/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-lg tracking-wide group"
                >
                    {loading ? <Loader className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                    {loading ? 'Searching Rides...' : 'Find Available Rides'}
                </button>
                  </>
                )}

                 {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}
            </div>
        </div>

        {/* Results Section */}
        <div className="max-w-2xl mx-auto mt-12 space-y-6">
          {hasSearched && rides.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Filter Pickup by Text</label>
                <input
                  type="text"
                  value={pickupFilterText}
                  onChange={(e) => setPickupFilterText(e.target.value)}
                  placeholder="e.g., Dhanmondi"
                  className="w-full h-[48px] bg-[#1E293B] border border-[#334155] rounded-xl px-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Filter Dropoff by Text</label>
                <input
                  type="text"
                  value={dropoffFilterText}
                  onChange={(e) => setDropoffFilterText(e.target.value)}
                  placeholder="e.g., Gulshan"
                  className="w-full h-[48px] bg-[#1E293B] border border-[#334155] rounded-xl px-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>
            </div>
          )}

          {hasSearched && filteredRides.length === 0 && !loading && !error && (
                <div className="text-center py-12 bg-[#1E293B]/50 rounded-3xl border border-[#334155] border-dashed">
                    <div className="bg-[#334155]/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
              <h3 className="text-xl font-bold text-white mb-2">No Rides Found</h3>
              <p className="text-gray-400">Try changing your date, map search, or text filters.</p>
                </div>
            )}

          {filteredRides.map((ride) => (
                <div key={ride._id} className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] hover:border-[#4F46E5] transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-[#334155] rounded-full flex items-center justify-center border border-[#475569]">
                                <User className="w-6 h-6 text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-[#4F46E5] transition-colors">
                                    {ride.driver?.name || 'Driver'}
                                </h3>
                                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>4.8</span>
                                    <span className="text-gray-500 ml-1">• 120 rides</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-[#10B981]">৳{ride.pricePerSeat}</span>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Per Seat</p>
                        </div>
                    </div>

                    <div className="relative pl-4 space-y-6 border-l border-[#334155] ml-2 mb-6">
                        <div className="relative">
                             <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#4F46E5] border-2 border-[#1E293B]"></div>
                             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Pickup</p>
                             <p className="text-white text-sm font-semibold line-clamp-1">{ride.origin?.placeName || ride.origin?.address}</p>
                             {ride.origin?.placeName && ride.origin?.address && ride.origin.placeName !== ride.origin.address && (
                               <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ride.origin.address}</p>
                             )}
                             <p className="text-xs text-gray-500 mt-1">{formatTime(ride.departureTime)}</p>
                        </div>
                         <div className="relative">
                             <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#1E293B]"></div>
                             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Dropoff</p>
                             <p className="text-white text-sm font-semibold line-clamp-1">{ride.destination?.placeName || ride.destination?.address}</p>
                             {ride.destination?.placeName && ride.destination?.address && ride.destination.placeName !== ride.destination.address && (
                               <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ride.destination.address}</p>
                             )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#334155]">
                         <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5 bg-[#334155]/30 px-2 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{ride.routeData?.durationMin || 45} min</span>
                            </div>
                             <div className="flex items-center gap-1.5 bg-[#334155]/30 px-2 py-1 rounded-lg">
                                <User className="w-3.5 h-3.5" />
                                <span>{ride.seatsTotal - (ride.seatsBooked || 0)} seats left</span>
                            </div>
                         </div>
                         <button className="bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                            Book Ride <ArrowRight className="w-4 h-4" />
                         </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default HopperMode;
