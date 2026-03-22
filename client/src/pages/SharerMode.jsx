import React, { useState, useEffect, useCallback } from 'react';
import { Shield, MapPin, Clock, CheckCircle, DollarSign, Users, Calendar, Fuel, Locate, ArrowRight, ArrowLeft } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import RouteMap from '../components/RouteMap';
import GoogleLocationInput from '../components/GoogleLocationInput';
import { fetchFuelPrice, getRouteDetails, FUEL_PRICES } from '../utils/rideCalculator';

const LIBRARIES = ['places', 'geometry'];

// Progress Bar Component
const ProgressBar = ({ step, totalSteps }) => (
    <div className="w-full mb-8">
        <div className="flex justify-between mb-2 px-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
                <div 
                    key={idx} 
                    className={`text-xs font-bold uppercase tracking-wider ${step > idx + 1 ? 'text-[#10B981]' : step === idx + 1 ? 'text-[#4F46E5]' : 'text-slate-600'}`}
                >
                    Step {idx + 1}
                </div>
            ))}
        </div>
        <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#10B981] transition-all duration-300 ease-in-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
            />
        </div>
    </div>
);

const SharerMode = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [step, setStep] = useState(1);
  const totalSteps = 4;

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

  const handleNext = () => {
      if (step === 1 && (!originLocation || !destLocation)) {
          setError("Please select both Origin and Destination");
          return;
      }
      if (step === 2 && (!formData.date || !formData.time)) {
          setError("Please select Date and Time");
          return;
      }
      // Step 3 validation is handled by min/max inputs mostly, but ensure they are filled
      if (step === 3 && (!formData.seatsTotal || !formData.mileage)) {
          setError("Please fill all vehicle details");
          return;
      }

      setError('');
      setStep(prev => prev + 1);
  };

  const handleBack = () => {
      setError('');
      setStep(prev => prev - 1);
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
      
      if (step < totalSteps) {
        handleNext();
        return;
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

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Failed to create ride (non-JSON response)');
      }

      if (!res.ok) throw new Error(data.message || 'Failed to create ride');

      setIsPosted(true);
    } catch (err) {
      console.error("Ride creation failed:", err);
      setError(err.message || "Something went wrong");
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
    <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen relative z-10 text-[#F8FAFC]">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">
          List Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#10B981]">Ride</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Post your commute, find co-riders, and split the cost of your journey.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-[#334155]/20 backdrop-blur-sm p-8 rounded-3xl border border-[#334155] shadow-2xl relative">
        {isPosted ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500 py-10">
            <div className="mx-auto w-24 h-24 bg-[#10B981]/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-[#10B981]" />
            </div>
            <h2 className="text-3xl font-bold text-white">Ride Created Successfully!</h2>
            <div className="mt-8 p-6 bg-[#1E293B] rounded-2xl inline-block text-left min-w-[300px] border border-[#334155]">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Total Distance</span>
                    <span className="text-white font-bold">{rideMetrics.distanceKm} km</span>
                </div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-bold">~{rideMetrics.durationMin} mins</span>
                </div>
                <div className="h-px bg-[#334155] my-3"></div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Fuel Cost</span>
                    <span className="text-[#10B981] font-bold text-lg">৳{rideMetrics.totalCost}</span>
                </div>
            </div>
            <p className="text-gray-400 text-lg mt-6">We will notify you when someone requests to join.</p>
            <button 
              onClick={() => {
                setIsPosted(false);
                setStep(1);
                setFormData(prev => ({ ...prev, origin: '', destination: '' })); 
                setOriginLocation(null);
                setDestLocation(null);
                setRideMetrics({ ...rideMetrics, totalCost: 0 });
              }}
              className="mt-8 px-8 py-3 bg-[#4F46E5] hover:bg-[#4338ca] text-white rounded-xl font-medium transition-all shadow-lg shadow-[#4F46E5]/20"
            >
              Post Another Ride
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-white">
                    {step === 1 && "Start & Destination"}
                    {step === 2 && "Time & Date"}
                    {step === 3 && "Vehicle & Fuel"}
                    {step === 4 && "Review & Confirm"}
                 </h2>
                 <span className="text-sm text-gray-400 font-medium">Step {step} of {totalSteps}</span>
            </div>
            
            <ProgressBar step={step} totalSteps={totalSteps} />

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* Step 1: Route */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="flex gap-2 items-end">
                        <div className="flex-grow">
                            <GoogleLocationInput
                                label="Starting Point"
                                value={formData.origin}
                                onChange={(val) => handleLocationChange('origin', val)}
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
                            value={formData.destination}
                            onChange={(val) => handleLocationChange('destination', val)}
                            onPlaceSelected={(place) => handlePlaceSelected('destination', place)}
                            isLoaded={isLoaded}
                            placeholder="Search destination..."
                            icon={MapPin}
                        />
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-[#334155] h-[300px]">
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
                </div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Date of Journey</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <input 
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                          className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Departure Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                        <select 
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          required
                          className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] appearance-none transition-all"
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
                </div>
              )}

              {/* Step 3: Vehicle & Fuel */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Seats Available</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                                <input 
                                type="number"
                                name="seatsTotal"
                                value={formData.seatsTotal}
                                onChange={handleChange}
                                placeholder="3"
                                min="1"
                                max="6"
                                required
                                className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Maximum 6 seats allowed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Type</label>
                            <div className="relative">
                                <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                                <select 
                                    name="fuelType"
                                    value={formData.fuelType}
                                    onChange={handleChange}
                                    className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] appearance-none text-sm transition-all"
                                >
                                    <option value="octane">Octane (৳130/L)</option>
                                    <option value="petrol">Petrol (৳125/L)</option>
                                    <option value="diesel">Diesel (৳109/L)</option>
                                    <option value="brid">Hybrid (৳130/L)</option>
                                    <option value="cng">CNG (৳43/unit)</option>
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Vehicle Mileage (km/L)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10 text-xs font-bold">KM</span>
                                <input 
                                    type="number"
                                    name="mileage"
                                    value={formData.mileage}
                                    onChange={handleChange}
                                    placeholder="12"
                                    min="1"
                                    max="50"
                                    required
                                    className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Average mileage of your car in city traffic.</p>
                        </div>
                    </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                <div className="w-2 h-2 bg-[#4F46E5] rounded-full mb-1"></div>
                                <div className="w-0.5 h-10 bg-gray-700 ml-[3px]"></div>
                                <div className="w-2 h-2 bg-[#10B981] rounded-full mt-1"></div>
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">From</p>
                                    <p className="text-white font-medium">{formData.origin}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">To</p>
                                    <p className="text-white font-medium">{formData.destination}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
                            <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                            <p className="font-semibold text-white">{formData.date}</p>
                            <p className="text-sm text-[#10B981]">{formData.time}</p>
                        </div>
                         <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
                            <p className="text-xs text-gray-500 mb-1">Distance & Time</p>
                            <p className="font-semibold text-white">{rideMetrics.distanceKm} km</p>
                            <p className="text-sm text-gray-400">~{rideMetrics.durationMin} min</p>
                        </div>
                    </div>

                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#334155]">
                         <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-400">Estimated Total Fuel Cost</p>
                            <p className="text-2xl font-bold text-[#10B981]">৳{rideMetrics.totalCost}</p>
                         </div>
                         <div className="flex justify-between items-center text-sm pt-4 border-t border-[#334155]">
                            <p className="text-gray-400">Estimated Cost Per Person (if full)</p>
                            <p className="text-white font-medium">~ ৳{rideMetrics.minPrice}</p>
                         </div>
                    </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-[#334155]">
                {step > 1 && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 h-[52px] rounded-xl font-medium border border-[#334155] hover:bg-[#334155] text-white transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                )}
                
                {step < totalSteps && (
                    <button
                        type="button"
                        onClick={handleNext}
                        className={`flex-1 h-[52px] rounded-xl font-medium bg-[#4F46E5] hover:bg-[#4338ca] text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4F46E5]/20 ${step === 1 ? 'w-full' : ''}`}
                    >
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
                
                 {step === totalSteps && (
                     <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 h-[52px] rounded-xl font-bold bg-[#10B981] hover:bg-[#059669] text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
                    >
                        {loading ? 'Publishing...' : 'Publish Ride'}
                        {!loading && <CheckCircle className="w-5 h-5" />}
                    </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharerMode;
