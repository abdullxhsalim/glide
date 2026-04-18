import React, { useState, useEffect, useCallback } from 'react';
import { Shield, MapPin, Clock, CheckCircle, DollarSign, Users, Calendar, Fuel, Locate, ArrowRight, ArrowLeft, Edit3, Trash2, ListChecks, PlusCircle, UserCheck, XCircle } from 'lucide-react';
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
  const [activeSharerPanel, setActiveSharerPanel] = useState('publish');

  const [isPosted, setIsPosted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [ridesLoading, setRidesLoading] = useState(false);
  const [ridesError, setRidesError] = useState('');
  const [driverRides, setDriverRides] = useState([]);
  const [editRideId, setEditRideId] = useState('');
  const [savingRide, setSavingRide] = useState(false);
  const [startingRideId, setStartingRideId] = useState('');
  const [deletingRideId, setDeletingRideId] = useState('');
  const [driverBookings, setDriverBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingActionId, setBookingActionId] = useState('');
  const [editForm, setEditForm] = useState({
    departureDate: '',
    departureHour: '12',
    departureMinute: '00',
    departurePeriod: 'AM',
    seatsTotal: '',
    totalFuelCost: '',
    status: 'scheduled',
    multipleStoppages: false,
    expressway: false
  });

  // Keep track of full location objects { name, address, lat, lng }
  const [originLocation, setOriginLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);

  const getGeocoderName = (result) => {
    if (!result) return '';
    const poi = result.address_components?.find((c) => c.types?.includes('point_of_interest'))?.long_name;
    const locality = result.address_components?.find((c) => c.types?.includes('locality'))?.long_name;
    return poi || locality || '';
  };

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    seatsTotal: '3', // Default 3 passengers
    mileage: '12', // km/L default
    fuelType: 'octane', // Default fuel type
    multipleStoppages: false,
    expressway: false,
  });

  const [timeParts, setTimeParts] = useState({
    hour: '',
    minute: '',
    period: 'AM'
  });

  const [rideMetrics, setRideMetrics] = useState({
    totalCost: 0,
    distanceKm: 0,
    durationMin: 0,
    minPrice: 0,
    maxPrice: 0,
    routeGeometry: null
  });

  const getToken = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return userInfo?.token || '';
  };

  const formatDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getEditTimeParts = (value) => {
    const localDateTime = formatDateTimeLocal(value);
    if (!localDateTime) {
      return {
        departureDate: '',
        departureHour: '12',
        departureMinute: '00',
        departurePeriod: 'AM'
      };
    }

    const [datePart, timePart] = localDateTime.split('T');
    const [hourStr = '00', minuteStr = '00'] = (timePart || '').split(':');

    let hour24 = parseInt(hourStr, 10);
    if (Number.isNaN(hour24)) hour24 = 0;

    const departurePeriod = hour24 >= 12 ? 'PM' : 'AM';
    let departureHour = hour24 % 12;
    if (departureHour === 0) departureHour = 12;

    return {
      departureDate: datePart,
      departureHour: String(departureHour).padStart(2, '0'),
      departureMinute: String(parseInt(minuteStr, 10) || 0).padStart(2, '0'),
      departurePeriod
    };
  };

  const loadMyRides = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setRidesError('Please log in again to manage your rides.');
      return;
    }

    setRidesLoading(true);
    setRidesError('');
    try {
      const response = await fetch('/api/rides/mine', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load your rides');
      }

      setDriverRides(Array.isArray(data) ? data : []);
    } catch (err) {
      setRidesError(err.message || 'Failed to load your rides');
    } finally {
      setRidesLoading(false);
    }
  }, []);

  const loadDriverBookings = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setBookingsError('Please log in again to view ride requests.');
      return;
    }

    setBookingsLoading(true);
    setBookingsError('');
    try {
      const response = await fetch('/api/bookings/driver?status=pending', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load booking requests');
      }

      setDriverBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setBookingsError(err.message || 'Failed to load booking requests');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const handleBookingAction = async (bookingId, action) => {
    const token = getToken();
    if (!token) {
      setBookingsError('Please log in again to manage booking requests.');
      return;
    }

    setBookingActionId(bookingId);
    setBookingsError('');
    try {
      const response = await fetch(`/api/bookings/${bookingId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} booking request`);
      }

      setDriverBookings((prev) => prev.filter((booking) => booking._id !== bookingId));

      if (action === 'accepted' && data?.ride?._id) {
        setDriverRides((prev) =>
          prev.map((ride) =>
            ride._id === data.ride._id
              ? {
                ...ride,
                seatsBooked: data.ride.seatsBooked,
                seatsTotal: data.ride.seatsTotal
              }
              : ride
          )
        );
      }
    } catch (err) {
      setBookingsError(err.message || `Failed to ${action} booking request`);
    } finally {
      setBookingActionId('');
    }
  };

  const handleStartEdit = (ride) => {
    const timeParts = getEditTimeParts(ride.departureTime);
    setEditRideId(ride._id);
    setEditForm({
      ...timeParts,
      seatsTotal: ride.seatsTotal || '',
      totalFuelCost: ride.totalFuelCost || '',
      status: ride.status || 'scheduled',
      multipleStoppages: Boolean(ride.preferences?.multipleStoppages),
      expressway: Boolean(ride.preferences?.expressway)
    });
  };

  const handleCancelEdit = () => {
    setEditRideId('');
    setEditForm({
      departureDate: '',
      departureHour: '12',
      departureMinute: '00',
      departurePeriod: 'AM',
      seatsTotal: '',
      totalFuelCost: '',
      status: 'scheduled',
      multipleStoppages: false,
      expressway: false
    });
  };

  const handleUpdateRide = async (rideId) => {
    const token = getToken();
    if (!token) {
      setRidesError('Please log in again to manage your rides.');
      return;
    }

    setSavingRide(true);
    setRidesError('');
    try {
      const hourNum = Number(editForm.departureHour);
      const minuteNum = Number(editForm.departureMinute);

      if (!editForm.departureDate || Number.isNaN(hourNum) || Number.isNaN(minuteNum)) {
        throw new Error('Please provide date and valid time');
      }

      if (hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
        throw new Error('Time must be valid (hour 1-12, minute 0-59)');
      }

      const hour24 = (() => {
        if (editForm.departurePeriod === 'AM') {
          return hourNum === 12 ? 0 : hourNum;
        }
        return hourNum === 12 ? 12 : hourNum + 12;
      })();

      const departureTime = new Date(`${editForm.departureDate}T${String(hour24).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}:00`);

      const payload = {
        departureTime: departureTime.toISOString(),
        seatsTotal: Number(editForm.seatsTotal),
        totalFuelCost: Number(editForm.totalFuelCost),
        status: editForm.status,
        preferences: {
          multipleStoppages: Boolean(editForm.multipleStoppages),
          expressway: Boolean(editForm.expressway)
        }
      };

      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update ride');
      }

      setDriverRides((prev) => prev.map((ride) => (ride._id === rideId ? data : ride)));
      handleCancelEdit();
    } catch (err) {
      setRidesError(err.message || 'Failed to update ride');
    } finally {
      setSavingRide(false);
    }
  };

  const handleDeleteRide = async (rideId) => {
    const token = getToken();
    if (!token) {
      setRidesError('Please log in again to manage your rides.');
      return;
    }

    const shouldDelete = window.confirm('Delete this ride permanently?');
    if (!shouldDelete) return;

    setDeletingRideId(rideId);
    setRidesError('');
    try {
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete ride');
      }

      setDriverRides((prev) => prev.filter((ride) => ride._id !== rideId));
      if (editRideId === rideId) {
        handleCancelEdit();
      }
    } catch (err) {
      setRidesError(err.message || 'Failed to delete ride');
    } finally {
      setDeletingRideId('');
    }
  };

  const handleStartRide = async (rideId) => {
    const token = getToken();
    if (!token) {
      setRidesError('Please log in again to manage your rides.');
      return;
    }

    setStartingRideId(rideId);
    setRidesError('');

    try {
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'in-progress' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start ride');
      }

      setDriverRides((prev) => prev.map((ride) => (ride._id === rideId ? data : ride)));

      if (editRideId === rideId) {
        setEditForm((prev) => ({ ...prev, status: 'in-progress' }));
      }
    } catch (err) {
      setRidesError(err.message || 'Failed to start ride');
    } finally {
      setStartingRideId('');
    }
  };

  useEffect(() => {
    if (activeSharerPanel === 'manage') {
      loadMyRides();
      loadDriverBookings();
    }
  }, [activeSharerPanel, loadMyRides, loadDriverBookings]);

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
                const name = getGeocoderName(results[0]) || address;
                setFormData(prev => ({ ...prev, origin: name }));
                setOriginLocation({ name, address, lat, lng });
              } else {
                // Fallback if address not found
                const locStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                setFormData(prev => ({ ...prev, origin: locStr }));
                setOriginLocation({ name: locStr, address: locStr, lat, lng });
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

  const syncTimeToFormData = (parts) => {
    if (!parts.hour || parts.minute === '') {
      setFormData((prev) => ({ ...prev, time: '' }));
      return;
    }

    const hourNum = Math.min(12, Math.max(1, Number(parts.hour)));
    const minuteNum = Math.min(59, Math.max(0, Number(parts.minute)));
    const hour = String(hourNum).padStart(2, '0');
    const minute = String(minuteNum).padStart(2, '0');
    setFormData((prev) => ({ ...prev, time: `${hour}:${minute} ${parts.period}` }));
  };

  const handleTimePartChange = (field, value) => {
    const next = { ...timeParts, [field]: value };
    setTimeParts(next);
    syncTimeToFormData(next);
  };

  const handlePlaceSelected = (field, placeData) => {
    setFormData(prev => ({ ...prev, [field]: placeData.name || placeData.address }));
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
        const name = getGeocoderName(results[0]) || address;
        const locData = { name, address, lat, lng };

        if (!originLocation) {
          setOriginLocation(locData);
          setFormData(prev => ({ ...prev, origin: name }));
        } else {
          setDestLocation(locData);
          setFormData(prev => ({ ...prev, destination: name }));
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
          placeName: originLocation.name || originLocation.address,
          address: originLocation.address
        },
        destination: {
          type: 'Point',
          coordinates: [destLocation.lng, destLocation.lat],
          placeName: destLocation.name || destLocation.address,
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
          ac: true,
          quietPayload: false,
          pets: false,
          expressway: formData.expressway,
          multipleStoppages: formData.multipleStoppages
        }
      };

      console.log('DEBUG: Payload to send:', {
        originName: payload.origin.placeName,
        originAddress: payload.origin.address,
        destName: payload.destination.placeName,
        destAddress: payload.destination.address
      });

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
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      return `${timeStr}:00`;
    }
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

      <div className="max-w-3xl mx-auto mb-6">
        <div className="bg-[#334155]/40 backdrop-blur-sm p-1 rounded-2xl border border-[#334155] grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveSharerPanel('publish')}
            className={`h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeSharerPanel === 'publish' ? 'bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/20' : 'text-gray-300 hover:bg-[#1E293B]'
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            Publish Ride
          </button>
          <button
            type="button"
            onClick={() => setActiveSharerPanel('manage')}
            className={`h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeSharerPanel === 'manage' ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20' : 'text-gray-300 hover:bg-[#1E293B]'
              }`}
          >
            <ListChecks className="w-4 h-4" />
            My Published Rides
          </button>
        </div>
      </div>

      {activeSharerPanel === 'publish' ? (
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
                        {!originLocation ? "Click map to set Origin" : !destLocation ? "Click map to set Destination" : "Route Preview"}
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
                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                            <input
                              type="number"
                              min="1"
                              max="12"
                              placeholder="HH"
                              value={timeParts.hour}
                              onChange={(e) => handleTimePartChange('hour', e.target.value)}
                              required
                              className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-3 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              placeholder="MM"
                              value={timeParts.minute}
                              onChange={(e) => handleTimePartChange('minute', e.target.value)}
                              required
                              className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl px-3 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                            />
                          </div>
                          <div>
                            <select
                              value={timeParts.period}
                              onChange={(e) => handleTimePartChange('period', e.target.value)}
                              className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl px-3 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Use the up/down arrows to set hour and minute.</p>
                      </div>
                    </div>

                    <div className="border-t border-[#334155] pt-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Journey Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-[#1E293B]/50 border border-[#334155] rounded-lg hover:bg-[#1E293B] hover:border-[#4F46E5] cursor-pointer transition-all group">
                          <input
                            type="checkbox"
                            name="multipleStoppages"
                            checked={formData.multipleStoppages}
                            onChange={(e) => setFormData({ ...formData, multipleStoppages: e.target.checked })}
                            className="w-5 h-5 rounded cursor-pointer accent-[#4F46E5]"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium group-hover:text-[#4F46E5] transition-colors">Multiple Stoppages</p>
                            <p className="text-xs text-gray-500">I'm willing to make stops along the way</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-[#1E293B]/50 border border-[#334155] rounded-lg hover:bg-[#1E293B] hover:border-[#4F46E5] cursor-pointer transition-all group">
                          <input
                            type="checkbox"
                            name="expressway"
                            checked={formData.expressway}
                            onChange={(e) => setFormData({ ...formData, expressway: e.target.checked })}
                            className="w-5 h-5 rounded cursor-pointer accent-[#4F46E5]"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium group-hover:text-[#4F46E5] transition-colors">Expressway Tolls</p>
                            <p className="text-xs text-gray-500">I plan to use expressway routes (toll charges apply)</p>
                          </div>
                        </label>
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
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155]">
                      <div className="relative grid grid-cols-[20px_1fr] gap-x-4 gap-y-8">
                        <div className="absolute left-[10px] -translate-x-1/2 top-3 bottom-3 w-0.5 bg-gray-700"></div>

                        <div className="relative z-10 flex justify-center pt-1">
                          <div className="w-4 h-4 bg-[#1E293B] rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#4F46E5] rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">From</p>
                          <p className="text-white font-medium">{originLocation?.name || formData.origin}</p>
                          {originLocation?.address && originLocation.name !== originLocation.address && (
                            <p className="text-xs text-gray-400 mt-1">{originLocation.address}</p>
                          )}
                        </div>

                        <div className="relative z-10 flex justify-center pt-1">
                          <div className="w-4 h-4 bg-[#1E293B] rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">To</p>
                          <p className="text-white font-medium">{destLocation?.name || formData.destination}</p>
                          {destLocation?.address && destLocation.name !== destLocation.address && (
                            <p className="text-xs text-gray-400 mt-1">{destLocation.address}</p>
                          )}
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

                    <div className="border-t border-[#334155] pt-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Journey Preferences</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg border ${formData.multipleStoppages ? 'bg-[#4F46E5]/10 border-[#4F46E5]' : 'bg-[#1E293B]/50 border-[#334155]'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded border ${formData.multipleStoppages ? 'bg-[#4F46E5] border-[#4F46E5]' : 'border-[#334155]'}`}>
                              {formData.multipleStoppages && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${formData.multipleStoppages ? 'text-[#4F46E5]' : 'text-gray-400'}`}>Multiple Stoppages</p>
                              <p className="text-xs text-gray-500">{formData.multipleStoppages ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg border ${formData.expressway ? 'bg-[#4F46E5]/10 border-[#4F46E5]' : 'bg-[#1E293B]/50 border-[#334155]'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded border ${formData.expressway ? 'bg-[#4F46E5] border-[#4F46E5]' : 'border-[#334155]'}`}>
                              {formData.expressway && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${formData.expressway ? 'text-[#4F46E5]' : 'text-gray-400'}`}>Expressway Tolls</p>
                              <p className="text-xs text-gray-500">{formData.expressway ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </div>
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
      ) : (
        <div className="max-w-3xl mx-auto bg-[#334155]/20 backdrop-blur-sm p-8 rounded-3xl border border-[#334155] shadow-2xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">Manage Your Published Rides</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#4F46E5]/20 text-[#C7D2FE] text-xs font-semibold border border-[#4F46E5]/30">
                Pending Requests: {driverBookings.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  loadMyRides();
                  loadDriverBookings();
                }}
                className="px-4 py-2 rounded-lg border border-[#334155] text-sm text-gray-200 hover:bg-[#1E293B] transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {ridesError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              {ridesError}
            </div>
          )}

          {bookingsError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              {bookingsError}
            </div>
          )}

          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-lg font-semibold text-white">Booking Requests</h3>
            </div>

            {bookingsLoading ? (
              <p className="text-sm text-gray-400">Loading pending requests...</p>
            ) : driverBookings.length === 0 ? (
              <p className="text-sm text-gray-400">No pending requests right now.</p>
            ) : (
              <div className="space-y-3">
                {driverBookings.map((booking) => (
                  <div key={booking._id} className="rounded-xl border border-[#334155] bg-[#0F172A]/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-300 font-semibold">{booking.rider?.name || 'Hopper'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Seats requested: {booking.seatsBooked} • Trip fare: ৳{booking.tripPrice}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {booking.ride?.origin?.placeName || booking.ride?.origin?.address || 'Origin'} → {booking.ride?.destination?.placeName || booking.ride?.destination?.address || 'Destination'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Departure: {booking.ride?.departureTime ? new Date(booking.ride.departureTime).toLocaleString() : 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={bookingActionId === booking._id}
                          onClick={() => handleBookingAction(booking._id, 'accepted')}
                          className="h-9 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={bookingActionId === booking._id}
                          onClick={() => handleBookingAction(booking._id, 'rejected')}
                          className="h-9 px-3 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-gray-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {ridesLoading ? (
            <div className="text-gray-300 text-sm">Loading your rides...</div>
          ) : driverRides.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#334155] rounded-2xl bg-[#1E293B]/40">
              <p className="text-lg text-gray-300">No published rides found.</p>
              <p className="text-sm text-gray-500 mt-1">Switch to Publish Ride to create your first ride.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {driverRides.map((ride) => (
                <div key={ride._id} className="bg-[#1E293B] rounded-2xl border border-[#334155] p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">{new Date(ride.departureTime).toLocaleString()}</p>
                      <h3 className="text-base font-semibold text-white mt-1">
                        {ride.origin?.placeName || ride.origin?.address || 'Origin'} → {ride.destination?.placeName || ride.destination?.address || 'Destination'}
                      </h3>
                      <p className="text-sm text-gray-400 mt-2">
                        Seats: {ride.seatsBooked}/{ride.seatsTotal} booked • Fuel Cost: ৳{ride.totalFuelCost}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${ride.preferences?.multipleStoppages
                              ? 'bg-[#4F46E5]/15 border-[#4F46E5]/40 text-[#C7D2FE]'
                              : 'bg-[#0F172A] border-[#334155] text-gray-400'
                            }`}
                        >
                          Multiple Stoppages: {ride.preferences?.multipleStoppages ? 'Yes' : 'No'}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${ride.preferences?.expressway
                              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#A7F3D0]'
                              : 'bg-[#0F172A] border-[#334155] text-gray-400'
                            }`}
                        >
                          Expressway: {ride.preferences?.expressway ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <p className="text-xs mt-2 inline-block px-2 py-1 rounded-md bg-[#334155] text-gray-200 uppercase tracking-wide">
                        {ride.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ride.status === 'scheduled' ? (
                        <button
                          type="button"
                          onClick={() => handleStartRide(ride._id)}
                          disabled={startingRideId === ride._id}
                          className="h-10 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] border border-[#10B981] text-white text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-60"
                        >
                          {startingRideId === ride._id ? 'Starting...' : 'Start Ride'}
                        </button>
                      ) : ride.status === 'in-progress' ? (
                        <button
                          type="button"
                          disabled
                          className="h-10 px-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#A7F3D0] text-sm font-medium"
                        >
                          Ride Started
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(ride)}
                        className="h-10 px-3 rounded-lg bg-[#4F46E5]/90 hover:bg-[#4F46E5] border border-[#6366F1] text-white text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-[#4F46E5]/20"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRide(ride._id)}
                        disabled={deletingRideId === ride._id}
                        className="h-10 px-3 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#475569] hover:border-[#F59E0B] text-[#F8FAFC] hover:text-[#FBBF24] text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingRideId === ride._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {editRideId === ride._id && (
                    <div className="border-t border-[#334155] pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Departure Date</label>
                        <input
                          type="date"
                          value={editForm.departureDate}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, departureDate: e.target.value }))}
                          className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Departure Time</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={editForm.departureHour}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, departureHour: e.target.value }))}
                            className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                          />
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={editForm.departureMinute}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, departureMinute: e.target.value }))}
                            className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                          />
                          <select
                            value={editForm.departurePeriod}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, departurePeriod: e.target.value }))}
                            className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Ride Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                          className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Total Seats</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.seatsTotal}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, seatsTotal: e.target.value }))}
                          className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Total Fuel Cost (BDT)</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.totalFuelCost}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, totalFuelCost: e.target.value }))}
                          className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-white"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={editForm.multipleStoppages}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, multipleStoppages: e.target.checked }))}
                          className="w-4 h-4 accent-[#4F46E5]"
                        />
                        Multiple Stoppages
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={editForm.expressway}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, expressway: e.target.checked }))}
                          className="w-4 h-4 accent-[#4F46E5]"
                        />
                        Expressway Tolls
                      </label>

                      <div className="md:col-span-2 flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateRide(ride._id)}
                          disabled={savingRide}
                          className="h-10 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold disabled:opacity-70"
                        >
                          {savingRide ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="h-10 px-4 rounded-lg border border-[#334155] text-gray-200 text-sm font-semibold hover:bg-[#334155]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharerMode;
