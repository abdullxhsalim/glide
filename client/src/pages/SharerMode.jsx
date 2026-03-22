import React, { useState, useEffect, useCallback } from 'react';
import { Shield, MapPin, Clock, CheckCircle, DollarSign, Users, Calendar, Fuel, Locate } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import RouteMap from '../components/RouteMap';
import GoogleLocationInput from '../components/GoogleLocationInput';
import { fetchFuelPrice, getRouteDetails, FUEL_PRICES } from '../utils/rideCalculator';

const LIBRARIES = ['places', 'geometry'];

const SharerMode = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [isPosted, setIsPosted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  
  // Keep track of full location objects { address, lat, lng }
  const [originLocation, setOriginLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    seatsTotal: '3', // Default 3 passengers
    mileage: '12', // km/L default
    fuelType: 'octane', // Default fuel type
  });

  const [rideMetrics, setRideMetrics] = useState({
    totalCost: 0,
    distanceKm: 0,
    durationMin: 0,
    minPrice: 0,
    maxPrice: 0,
    routeGeometry: null
  });

  // Handle "Use My Location"
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Reverse Geocoding (using Google Maps Geocoder)
          if (isLoaded && window.google) {
             const geocoder = new window.google.maps.Geocoder();
             geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK" && results[0]) {
                    const address = results[0].formatted_address;
                    setFormData(prev => ({ ...prev, origin: address }));
                    setOriginLocation({ address, lat, lng });
                } else {
                    // Fallback if address not found
                    const locStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setFormData(prev => ({ ...prev, origin: locStr }));
                    setOriginLocation({ address: locStr, lat, lng });
                }
             });
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Could not access your location. Please check browser permissions.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Calculate Estimation whenever relevant fields change
  const calculateEstimation = useCallback(async () => {
    if (!originLocation || !destLocation) return;
    
    setCalculating(true);
    try {
      // 1. Get Coordinates directly from state objects
      // Format for backend: [lng, lat]
      const originCoords = [originLocation.lng, originLocation.lat];
      const destCoords = [destLocation.lng, destLocation.lat];

      // 2. Fetch Route Data
      const routeData = await getRouteDetails(originCoords, destCoords);
      
      let distanceKm = 0;
      let geometry = null;
      let duration = 0;

      if (routeData) {
        distanceKm = (routeData.distanceMeter / 1000).toFixed(1);
        duration = Math.round(routeData.durationSeconds / 60);
        geometry = routeData.geometry;
      } else {
        distanceKm = 10; // Fallback
      }

      // 3. Get Fuel Price
      const fuelPrice = await fetchFuelPrice(formData.fuelType);

      // 4. Calculate Total Cost
      const mileage = parseFloat(formData.mileage) || 12;
      const totalFuelNeeded = distanceKm / mileage;
      const totalCost = Math.ceil(totalFuelNeeded * fuelPrice);

      // 5. Calculate Per Seat Prices
      const seats = parseInt(formData.seatsTotal) || 3;
      const maxPrice = Math.floor(totalCost / 2);
      const minPrice = Math.floor(totalCost / (seats + 1));

      setRideMetrics({
        totalCost,
        distanceKm,
        durationMin: duration,
        minPrice,
        maxPrice,
        routeGeometry: geometry
      });

    } catch (err) {
      console.error("Calculation error", err);
    } finally {
      setCalculating(false);
    }
  }, [originLocation, destLocation, formData.mileage, formData.fuelType, formData.seatsTotal]);

  // Trigger calculation when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
        calculateEstimation();
    }, 800); 
    return () => clearTimeout(timer);
  }, [calculateEstimation]);


  const handleChange = (e) => {
      // For regular inputs (not location)
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleLocationChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Use map logic to clear coordinate if user clears text? 
      if (value === '') {
          if (field === 'origin') setOriginLocation(null);
          if (field === 'destination') setDestLocation(null);
      }
  };

  const handlePlaceSelected = (field, placeData) => {
      setFormData(prev => ({ ...prev, [field]: placeData.address }));
      if (field === 'origin') setOriginLocation(placeData);
      if (field === 'destination') setDestLocation(placeData);
  };
  
  // Logic to allow pinning on map (basic implementation: toggle which one to set?)
  // For now, let's just say clicking map updates DESTINATION if Origin is set, or Origin if not?
  // Or add a toggle. "Click to set Origin" vs "Click to set Destination".
  // Keeping it simple: If Origin is empty, set Origin. If Origin set, set Destination.
  const handleMapClick = (e) => {
      if (!isLoaded || !window.google) return;
      
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              const locData = { address, lat, lng };
              
              if (!originLocation) {
                  setOriginLocation(locData);
                  setFormData(prev => ({ ...prev, origin: address }));
              } else {
                  setDestLocation(locData);
                  setFormData(prev => ({ ...prev, destination: address }));
              }
          }
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        throw new Error('You must be logged in to post a ride.');
      }

      if (!originLocation || !destLocation || !formData.time || !formData.seatsTotal) {
        throw new Error('Please fill in all fields (origin & destination from list).');
      }

      if (rideMetrics.totalCost <= 0) {
          throw new Error('Could not calculate ride cost. Please check locations.');
      }

      // Construct Departure Time
      const dateTimeString = `${formData.date}T${convertTimeTo24Hour(formData.time)}`;
      const departureTime = new Date(dateTimeString);

      const payload = {
        origin: {
          type: 'Point',
          coordinates: [originLocation.lng, originLocation.lat], // GeoJSON order
          address: originLocation.address
        },
        destination: {
          type: 'Point',
          coordinates: [destLocation.lng, destLocation.lat],
          address: destLocation.address
        },
        departureTime: departureTime,
        seatsTotal: parseInt(formData.seatsTotal),
        totalFuelCost: rideMetrics.totalCost,
        routeData: {
            distanceKm: rideMetrics.distanceKm,
            durationMin: rideMetrics.durationMin,
            geometry: rideMetrics.routeGeometry
        },
        preferences: {
          smoking: false,
          music: true,
          ac: true
        }
      };

      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ride');

      setIsPosted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertTimeTo24Hour = (timeStr) => {
    if (!timeStr) return "00:00:00";
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}:00`;
  };

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
            <div className="mt-4 p-4 bg-[#1E293B] rounded-xl inline-block text-left">
                <p className="text-gray-400 text-sm">Estimated Distance: <span className="text-white font-bold">{rideMetrics.distanceKm} km</span></p>
                <p className="text-gray-400 text-sm">Total Fuel Cost: <span className="text-[#10B981] font-bold">৳{rideMetrics.totalCost}</span></p>
            </div>
            <p className="text-gray-400 text-lg mt-4">Thank you for sharing your ride. We will notify you when someone hops in.</p>
            <button 
              onClick={() => {
                setIsPosted(false);
                setFormData({ ...formData, fuelType: 'octane', origin: '', destination: '' }); 
                setOriginLocation(null);
                setDestLocation(null);
                setRideMetrics({ ...rideMetrics, totalCost: 0 });
              }}
              className="mt-8 px-8 py-3 bg-[#334155] hover:bg-[#475569] text-white rounded-xl font-medium transition-all"
            >
              Post Another Ride
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Origin & Destination */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex space-x-2 items-end">
                    <div className="flex-grow">
                        <GoogleLocationInput
                            label="Starting Point"
                            value={formData.origin}
                            onChange={(val) => handleLocationChange('origin', val)}
                            onPlaceSelected={(place) => handlePlaceSelected('origin', place)}
                            isLoaded={isLoaded}
                            placeholder="Where from? Search place..."
                            icon={MapPin}
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleUseMyLocation}
                        className="bg-[#1E293B] border border-[#334155] h-[52px] w-[52px] rounded-xl flex items-center justify-center hover:bg-[#334155] transition-colors mb-[1px]"
                        title="Use Current Location"
                    >
                        <Locate className="text-[#4F46E5] w-6 h-6" />
                    </button>
                </div>
                
                <div>
                    <GoogleLocationInput
                        label="Destination"
                        value={formData.destination}
                        onChange={(val) => handleLocationChange('destination', val)}
                        onPlaceSelected={(place) => handlePlaceSelected('destination', place)}
                        isLoaded={isLoaded}
                        placeholder="Where to? Search place..."
                        icon={MapPin}
                    />
                </div>
              </div>

              {/* Route Map Visualization */}
              <div className="mb-4 animate-in fade-in zoom-in duration-300">
                {/* Always show map now so they can pin locations? Or only if API loaded */}
                <p className="text-xs text-center text-gray-500 mb-1">
                    { !originLocation ? "Click map to set Origin" : !destLocation ? "Click map to set Destination" : "Route Preview"}
                </p>
                <RouteMap 
                  origin={originLocation ? [originLocation.lng, originLocation.lat] : null}
                  destination={destLocation ? [destLocation.lng, destLocation.lat] : null}
                  geometry={rideMetrics.routeGeometry}
                  isLoaded={isLoaded}
                  onMapClick={handleMapClick}
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                    <input 
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Departure Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                    <select 
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] appearance-none"
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
                      <option>07:00 PM</option>
                      <option>08:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ride Details (Seats, Fuel Type, Mileage) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Seats Available</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                    <input 
                      type="number"
                      name="seatsTotal"
                      value={formData.seatsTotal}
                      onChange={handleChange}
                      placeholder="3"
                      min="1"
                      max="6"
                      required
                      className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Fuel Type</label>
                    <div className="relative">
                        <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <select 
                            name="fuelType"
                            value={formData.fuelType}
                            onChange={handleChange}
                            className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] appearance-none text-sm"
                        >
                            <option value="octane">Octane (৳130/L)</option>
                            <option value="petrol">Petrol (৳125/L)</option>
                            <option value="diesel">Diesel (৳109/L)</option>
                            <option value="brid">Hybrid (৳130/L)</option>
                            <option value="cng">CNG (৳43/unit)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Mileage (km/L)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 text-xs font-bold">KM</span>
                        <input 
                            type="number"
                            name="mileage"
                            value={formData.mileage}
                            onChange={handleChange}
                            placeholder="12"
                            min="1"
                            max="50"
                            required
                            className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5]"
                        />
                    </div>
                </div>
              </div>
              
              {/* Dynamic Price Display */}
               <div className="bg-[#1E293B] p-5 rounded-xl border border-[#334155]">
                  <div className="flex justify-between items-start mb-4 border-b border-[#334155] pb-4">
                      <div>
                          <p className="text-gray-400 text-sm">Estimated Distance</p>
                          <p className="text-white font-bold text-lg">{calculating ? '...' : `${rideMetrics.distanceKm} km`}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-gray-400 text-sm">Total Fuel Cost</p>
                          <p className="text-[#10B981] font-bold text-lg">{calculating ? '...' : `৳${rideMetrics.totalCost}`}</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-r border-[#334155] pr-4">
                        <span className="text-gray-400 text-xs block mb-1">If 1 person joins (Max)</span>
                        <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-[#F59E0B]">{calculating ? '...' : `৳${rideMetrics.maxPrice}`}</span>
                        <span className="text-gray-500 text-xs ml-1">/ person</span>
                        </div>
                    </div>
                    <div className="pl-4">
                        <span className="text-gray-400 text-xs block mb-1">If full car (Min)</span>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-[#10B981]">{calculating ? '...' : `৳${rideMetrics.minPrice}`}</span>
                            <span className="text-gray-500 text-xs ml-1">/ person</span>
                        </div>
                    </div>
                  </div>
                  <div className="pt-3 mt-2 text-center">
                    <p className="text-[10px] text-gray-500 italic">
                      Based on current fuel prices & calculated route distance.
                    </p>
                  </div>
               </div>

            </div>

            <button 
              type="submit"
              disabled={loading || calculating || rideMetrics.totalCost <= 0}
              className={`w-full py-4 text-lg font-bold rounded-xl transition-all shadow-lg shadow-[#4F46E5]/25 
              ${loading || calculating || rideMetrics.totalCost <= 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white'}`}
            >
              {loading ? 'Posting...' : calculating ? 'Calculating...' : 'Post Ride'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SharerMode;
