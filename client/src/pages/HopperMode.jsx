import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, User, Star, Loader, ArrowRight, ArrowLeft, Calendar, Locate, Phone, Edit3, Trash2 } from 'lucide-react';
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
  const [bookingRideId, setBookingRideId] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const [showPartnerFinder, setShowPartnerFinder] = useState(false);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [isFindingPartners, setIsFindingPartners] = useState(false);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [myPartnerRequests, setMyPartnerRequests] = useState([]);
  const [editingRequestId, setEditingRequestId] = useState('');
  const [savingRequestId, setSavingRequestId] = useState('');
  const [deletingRequestId, setDeletingRequestId] = useState('');
  const [requestEditForm, setRequestEditForm] = useState({
    pickupLocation: '',
    destinationLocation: '',
    date: '',
    time: ''
  });
  const [partnerError, setPartnerError] = useState('');
  const [partnerSuccess, setPartnerSuccess] = useState('');
  const [partnerResults, setPartnerResults] = useState([]);
  const [partnerRequestConfirmed, setPartnerRequestConfirmed] = useState(false);
  const [partnerOriginLocation, setPartnerOriginLocation] = useState(null);
  const [partnerDestLocation, setPartnerDestLocation] = useState(null);
  const [partnerOriginInput, setPartnerOriginInput] = useState('');
  const [partnerDestInput, setPartnerDestInput] = useState('');

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

  const getGeocoderName = (result) => {
    if (!result) return '';
    const poi = result.address_components?.find((c) => c.types?.includes('point_of_interest'))?.long_name;
    const locality = result.address_components?.find((c) => c.types?.includes('locality'))?.long_name;
    return poi || locality || '';
  };


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
      console.log('DEBUG: Fetched rides with preferences:', data.map((r, i) => ({
        id: r._id,
        driver: r.driver?.name,
        preferences: r.preferences
      })));
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

  const handlePartnerInputChange = (field, value) => {
    setPartnerRequestConfirmed(false);
    if (field === 'origin') {
      setPartnerOriginInput(value);
      if (value === '') setPartnerOriginLocation(null);
    }
    if (field === 'destination') {
      setPartnerDestInput(value);
      if (value === '') setPartnerDestLocation(null);
    }
  };

  const handlePartnerPlaceSelected = (field, placeData) => {
    setPartnerRequestConfirmed(false);
    const normalizedPlace = {
      name: placeData.name || placeData.address,
      address: placeData.address,
      lat: placeData.lat,
      lng: placeData.lng,
      place_id: placeData.place_id
    };

    if (field === 'origin') {
      setPartnerOriginLocation(normalizedPlace);
      setPartnerOriginInput(normalizedPlace.name);
    }
    if (field === 'destination') {
      setPartnerDestLocation(normalizedPlace);
      setPartnerDestInput(normalizedPlace.name);
    }
  };

  const handlePartnerMapClick = (e) => {
    if (!isLoaded || !window.google) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        const name = getGeocoderName(results[0]) || address;
        const place = {
          name,
          address,
          lat,
          lng,
          place_id: results[0].place_id
        };

        if (!partnerOriginLocation) {
          setPartnerRequestConfirmed(false);
          setPartnerOriginLocation(place);
          setPartnerOriginInput(name);
        } else {
          setPartnerRequestConfirmed(false);
          setPartnerDestLocation(place);
          setPartnerDestInput(name);
        }
      }
    });
  };

  const handleFindPartner = async () => {
    setPartnerError('');
    setPartnerResults([]);

    if (!partnerOriginLocation || !partnerDestLocation || !date || !time) {
      setPartnerError('Please select pickup, destination, date and time before finding a partner.');
      return;
    }

    const pickupLat = Number(partnerOriginLocation.lat);
    const pickupLng = Number(partnerOriginLocation.lng);
    const dropoffLat = Number(partnerDestLocation.lat);
    const dropoffLng = Number(partnerDestLocation.lng);

    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(dropoffLat) ||
      !Number.isFinite(dropoffLng)
    ) {
      setPartnerError('Pickup or destination coordinates are invalid. Please select locations from map/search again.');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setPartnerError('Please login to find a partner.');
        return;
      }

      setIsFindingPartners(true);
      setPartnerLoading(true);

      const params = new URLSearchParams({
        pickupLat: String(pickupLat),
        pickupLng: String(pickupLng),
        dropoffLat: String(dropoffLat),
        dropoffLng: String(dropoffLng),
        date,
        time
      });

      const res = await fetch(`/api/rides/find-partners?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to find partners');
      }

      setPartnerResults(data);
    } catch (err) {
      setPartnerError(err.message || 'Failed to find partners');
    } finally {
      setIsFindingPartners(false);
      setPartnerLoading(false);
    }
  };

  const handleFindPartnerForMyRequest = async (request) => {
    setPartnerError('');
    setPartnerSuccess('');
    setPartnerResults([]);

    const pickupLat = Number(request?.pickupCoordinates?.lat);
    const pickupLng = Number(request?.pickupCoordinates?.lng);
    const dropoffLat = Number(request?.destinationCoordinates?.lat);
    const dropoffLng = Number(request?.destinationCoordinates?.lng);

    const requestedDate = formatDateInput(request?.departureTime);
    const requestedTime = request?.timeLabel || '';

    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(dropoffLat) ||
      !Number.isFinite(dropoffLng) ||
      !requestedDate ||
      !requestedTime
    ) {
      setPartnerError('This request does not have complete information to find partner.');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setPartnerError('Please login to find a partner.');
        return;
      }

      setIsFindingPartners(true);
      setPartnerLoading(true);

      // Mirror selected request into finder state for visibility/continuation.
      setPartnerOriginLocation({
        name: request.pickupLocation,
        address: request.pickupAddress || request.pickupLocation,
        lat: pickupLat,
        lng: pickupLng
      });
      setPartnerDestLocation({
        name: request.destinationLocation,
        address: request.destinationAddress || request.destinationLocation,
        lat: dropoffLat,
        lng: dropoffLng
      });
      setPartnerOriginInput(request.pickupLocation || '');
      setPartnerDestInput(request.destinationLocation || '');
      setDate(requestedDate);
      setTime(requestedTime);
      setPartnerRequestConfirmed(true);
      setShowMyRequests(false);

      const params = new URLSearchParams({
        pickupLat: String(pickupLat),
        pickupLng: String(pickupLng),
        dropoffLat: String(dropoffLat),
        dropoffLng: String(dropoffLng),
        date: requestedDate,
        time: requestedTime
      });

      const res = await fetch(`/api/rides/find-partners?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to find partners');
      }

      setPartnerResults(data);
    } catch (err) {
      setPartnerError(err.message || 'Failed to find partners');
    } finally {
      setIsFindingPartners(false);
      setPartnerLoading(false);
    }
  };

  const handleSendPartnerInformation = async () => {
    setPartnerError('');
    setPartnerSuccess('');

    if (!partnerOriginLocation || !partnerDestLocation || !date || !time) {
      setPartnerError('Please insert pickup, destination, date and time first.');
      return;
    }

    const pickupLat = Number(partnerOriginLocation.lat);
    const pickupLng = Number(partnerOriginLocation.lng);
    const dropoffLat = Number(partnerDestLocation.lat);
    const dropoffLng = Number(partnerDestLocation.lng);

    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(dropoffLat) ||
      !Number.isFinite(dropoffLng)
    ) {
      setPartnerError('Pickup or destination coordinates are invalid. Please select locations from map/search again.');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setPartnerError('Please login to send your partner request.');
        return;
      }

      setPartnerLoading(true);

      const response = await fetch('/api/rides/partner-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup: {
            name: partnerOriginLocation.name || partnerOriginInput,
            address: partnerOriginLocation.address || partnerOriginInput,
            lat: pickupLat,
            lng: pickupLng
          },
          destination: {
            name: partnerDestLocation.name || partnerDestInput,
            address: partnerDestLocation.address || partnerDestInput,
            lat: dropoffLat,
            lng: dropoffLng
          },
          date,
          time
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to send your information');
      }

      setPartnerSuccess(payload.message || 'Your information has been sent successfully. Click Find Partner to match similar requests.');
      setPartnerRequestConfirmed(true);
    } catch (err) {
      setPartnerError(err.message || 'Failed to send your information');
    } finally {
      setPartnerLoading(false);
    }
  };

  const handleLoadMyRequests = async () => {
    setPartnerError('');
    setPartnerSuccess('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setPartnerError('Please login to view your requests.');
        return;
      }

      setMyRequestsLoading(true);
      setShowMyRequests(true);

      const response = await fetch('/api/rides/partner-requests/mine', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load your partner requests');
      }

      setMyPartnerRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setPartnerError(err.message || 'Failed to load your partner requests');
    } finally {
      setMyRequestsLoading(false);
    }
  };

  const formatPartnerSearchTime = (dateString) => {
    const dt = new Date(dateString);
    if (Number.isNaN(dt.getTime())) return '';

    let hour = dt.getHours();
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${String(hour).padStart(2, '0')}:00 ${suffix}`;
  };

  const formatDateInput = (dateString) => {
    const dt = new Date(dateString);
    if (Number.isNaN(dt.getTime())) return '';
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEditMyRequest = (request) => {
    setEditingRequestId(request.requestId);
    setRequestEditForm({
      pickupLocation: request.pickupLocation || '',
      destinationLocation: request.destinationLocation || '',
      date: formatDateInput(request.departureTime),
      time: request.timeLabel || ''
    });
  };

  const handleSaveMyRequest = async (requestId) => {
    setPartnerError('');

    if (
      !requestEditForm.pickupLocation.trim() ||
      !requestEditForm.destinationLocation.trim() ||
      !requestEditForm.date ||
      !requestEditForm.time
    ) {
      setPartnerError('Please fill pickup, destination, date and time before saving request changes.');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setPartnerError('Please login to edit your request.');
        return;
      }

      setSavingRequestId(requestId);

      const response = await fetch(`/api/rides/partner-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pickupLocation: requestEditForm.pickupLocation.trim(),
          destinationLocation: requestEditForm.destinationLocation.trim(),
          date: requestEditForm.date,
          time: requestEditForm.time
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update request');
      }

      setMyPartnerRequests((prev) => prev.map((req) => (req.requestId === requestId ? data : req)));
      setEditingRequestId('');
    } catch (err) {
      setPartnerError(err.message || 'Failed to update request');
    } finally {
      setSavingRequestId('');
    }
  };

  const handleDeleteMyRequest = async (requestId) => {
    setPartnerError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setPartnerError('Please login to delete your request.');
        return;
      }

      setDeletingRequestId(requestId);

      const response = await fetch(`/api/rides/partner-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete request');
      }

      setMyPartnerRequests((prev) => prev.filter((req) => req.requestId !== requestId));
      if (editingRequestId === requestId) {
        setEditingRequestId('');
      }
    } catch (err) {
      setPartnerError(err.message || 'Failed to delete request');
    } finally {
      setDeletingRequestId('');
    }
  };

  const handleUsePartnerInfo = (partner) => {
    setPartnerRequestConfirmed(false);
    const pickupLat = partner?.pickupCoordinates?.lat;
    const pickupLng = partner?.pickupCoordinates?.lng;
    const dropoffLat = partner?.destinationCoordinates?.lat;
    const dropoffLng = partner?.destinationCoordinates?.lng;

    if (typeof pickupLat === 'number' && typeof pickupLng === 'number') {
      setPartnerOriginLocation({
        name: partner.pickupLocation,
        address: partner.pickupLocation,
        lat: pickupLat,
        lng: pickupLng,
        place_id: undefined
      });
      setPartnerOriginInput(partner.pickupLocation || '');
    }

    if (typeof dropoffLat === 'number' && typeof dropoffLng === 'number') {
      setPartnerDestLocation({
        name: partner.destinationLocation,
        address: partner.destinationLocation,
        lat: dropoffLat,
        lng: dropoffLng,
        place_id: undefined
      });
      setPartnerDestInput(partner.destinationLocation || '');
    }

    if (partner?.departureTime) {
      const dt = new Date(partner.departureTime);
      if (!Number.isNaN(dt.getTime())) {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
        setTime(formatPartnerSearchTime(partner.departureTime));
      }
    }

    setPartnerError('');
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

  const handleBookRide = async (ride) => {
    setBookingError('');
    setBookingSuccess('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      if (!token) {
        setBookingError('Please login to book a ride.');
        return;
      }

      setBookingRideId(ride._id);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rideId: ride._id,
          seatsBooked: 1
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to book ride');
      }

      setBookingSuccess('Ride request sent. Waiting for sharer approval.');
      setRides((prev) =>
        prev.map((item) =>
          item._id === ride._id
            ? {
                ...item,
                hasRequested: true
              }
            : item
        )
      );
    } catch (err) {
      setBookingError(err.message || 'Failed to book ride');
    } finally {
      setBookingRideId('');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

        {!showPartnerFinder && (
        <>
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

        <div className="max-w-2xl mx-auto mt-8">
          <button
            onClick={() => {
              setShowPartnerFinder(true);
              setPartnerError('');
              setPartnerSuccess('');
              setPartnerRequestConfirmed(false);
            }}
            className="w-full py-4 bg-[#1E293B] border border-[#334155] hover:border-[#10B981] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5 text-[#10B981]" />
            Can't find any Ride? Find a Partner to share
          </button>
        </div>
        </>
        )}

        {showPartnerFinder && (
          <div className="max-w-2xl mx-auto mt-6 bg-[#334155]/30 backdrop-blur-xl rounded-3xl p-8 border border-[#334155] shadow-2xl">
            {!showMyRequests && (
              <>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">Partner Finder</h2>
              <button
                onClick={handleLoadMyRequests}
                disabled={myRequestsLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-gray-200 hover:border-[#0EA5E9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {myRequestsLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                My Request
              </button>
            </div>
            <p className="text-gray-400 mb-6">Select pickup and destination from map/search, choose date and time, then find nearby partners.</p>

            <div className="grid grid-cols-1 gap-5">
              <GoogleLocationInput
                label="Pickup Location"
                value={partnerOriginInput}
                onChange={(val) => handlePartnerInputChange('origin', val)}
                onPlaceSelected={(place) => handlePartnerPlaceSelected('origin', place)}
                isLoaded={isLoaded}
                placeholder="Search pickup location..."
                icon={MapPin}
              />
              <GoogleLocationInput
                label="Destination"
                value={partnerDestInput}
                onChange={(val) => handlePartnerInputChange('destination', val)}
                onPlaceSelected={(place) => handlePartnerPlaceSelected('destination', place)}
                isLoaded={isLoaded}
                placeholder="Search destination..."
                icon={MapPin}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setPartnerRequestConfirmed(false);
                      setDate(e.target.value);
                    }}
                    className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                  <select
                    value={time}
                    onChange={(e) => {
                      setPartnerRequestConfirmed(false);
                      setTime(e.target.value);
                    }}
                    className="w-full h-[56px] bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] appearance-none transition-all"
                  >
                    <option value="">Select Time</option>
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

            <div className="mt-5 rounded-xl overflow-hidden border border-[#334155] h-[280px] relative">
              <div className="absolute top-4 right-4 z-10 bg-[#1E293B]/80 backdrop-blur px-3 py-1 rounded-full border border-[#334155] text-xs text-gray-300">
                {!partnerOriginLocation ? 'Click map to set Pickup' : !partnerDestLocation ? 'Click map to set Destination' : 'Partner Route Selected'}
              </div>
              <RouteMap
                origin={partnerOriginLocation ? [partnerOriginLocation.lng, partnerOriginLocation.lat] : null}
                destination={partnerDestLocation ? [partnerDestLocation.lng, partnerDestLocation.lat] : null}
                geometry={null}
                isLoaded={isLoaded}
                onMapClick={handlePartnerMapClick}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowPartnerFinder(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-gray-200 hover:border-[#4F46E5] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleSendPartnerInformation}
                disabled={partnerLoading || !partnerOriginLocation || !partnerDestLocation || !date || !time}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E293B] border border-[#334155] text-white font-semibold hover:border-[#10B981] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {partnerLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {partnerLoading ? 'Sending...' : 'Send your information'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {partnerRequestConfirmed && (
              <button
                onClick={handleFindPartner}
                disabled={partnerLoading || !partnerOriginLocation || !partnerDestLocation || !date || !time}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] border border-[#0284C7] text-white font-semibold hover:bg-[#0284C7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {partnerLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {partnerLoading ? 'Finding...' : 'Find Partner'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isFindingPartners && partnerLoading && (
              <div className="mt-4 p-5 bg-[#1E293B] border border-[#334155] rounded-xl flex items-center gap-3 text-gray-200">
                <Loader className="w-5 h-5 animate-spin text-[#10B981]" />
                <div>
                  <p className="font-semibold text-white">Finding matching requests...</p>
                  <p className="text-sm text-gray-400">Trying to match similar pickup, destination and time information.</p>
                </div>
              </div>
            )}

            {partnerSuccess && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm rounded-xl">
                {partnerSuccess}
              </div>
            )}

            {partnerError && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl">
                {partnerError}
              </div>
            )}

            {!partnerLoading && partnerResults.length === 0 && !partnerError && (
              <div className="mt-4 p-4 bg-[#1E293B] border border-[#334155] text-gray-300 text-sm rounded-xl">
                Fill in pickup, destination, date and time. First click Send your information, then click Find Partner.
              </div>
            )}

            {partnerResults.length > 0 && (
              <div className="mt-6 space-y-4">
                {partnerResults.map((partner) => (
                  <div key={partner.requestId || partner.rideId} className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{partner.partnerName}</h3>
                        <p className="text-gray-400 text-sm mt-1">Matched pickup: {partner.pickupLocation}</p>
                        <p className="text-gray-400 text-sm">Destination: {partner.destinationLocation}</p>
                      </div>
                      <div className="text-right text-sm text-gray-300">
                        <p className="font-semibold">{formatDate(partner.departureTime)}</p>
                        <p>{formatTime(partner.departureTime)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      <div className="inline-flex items-center gap-2 bg-[#334155]/50 text-gray-200 px-3 py-1.5 rounded-lg">
                        <Phone className="w-4 h-4 text-[#10B981]" />
                        {partner.contactNumber}
                      </div>
                      <div className="inline-flex items-center gap-2 bg-[#334155]/50 text-gray-200 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-[#0EA5E9]" />
                        Pickup ~ {partner.pickupDistanceKm} km
                      </div>
                      <div className="inline-flex items-center gap-2 bg-[#334155]/50 text-gray-200 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-[#A78BFA]" />
                        Dropoff ~ {partner.dropoffDistanceKm} km
                      </div>
                      <div className="inline-flex items-center gap-2 bg-[#334155]/50 text-gray-200 px-3 py-1.5 rounded-lg">
                        <User className="w-4 h-4 text-[#F59E0B]" />
                        Request Match
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUsePartnerInfo(partner)}
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#6EE7B7] font-semibold hover:bg-[#10B981]/25 transition-all"
                    >
                      Use This Partner Info
                    </button>
                  </div>
                ))}
              </div>
            )}

              </>
            )}

            {showMyRequests && (
              <div className="mt-4 p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">My Ongoing Requests</h3>
                  <button
                    type="button"
                    onClick={() => setShowMyRequests(false)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#334155] text-gray-200 hover:border-[#4F46E5] text-xs transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Finder
                  </button>
                </div>

                {myRequestsLoading ? (
                  <div className="text-gray-300 text-sm flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading your requests...
                  </div>
                ) : myPartnerRequests.length === 0 ? (
                  <p className="text-gray-400 text-sm">No ongoing partner requests found.</p>
                ) : (
                  <div className="space-y-3">
                    {myPartnerRequests.map((request) => (
                      <div key={request.requestId} className="p-3 rounded-lg border border-[#334155] bg-[#0F172A]">
                        {editingRequestId === request.requestId ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={requestEditForm.pickupLocation}
                              onChange={(e) => setRequestEditForm((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                              className="w-full h-10 px-3 rounded-lg bg-[#1E293B] border border-[#334155] text-white text-sm"
                              placeholder="Pickup"
                            />
                            <input
                              type="text"
                              value={requestEditForm.destinationLocation}
                              onChange={(e) => setRequestEditForm((prev) => ({ ...prev, destinationLocation: e.target.value }))}
                              className="w-full h-10 px-3 rounded-lg bg-[#1E293B] border border-[#334155] text-white text-sm"
                              placeholder="Destination"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={requestEditForm.date}
                                onChange={(e) => setRequestEditForm((prev) => ({ ...prev, date: e.target.value }))}
                                className="h-10 px-3 rounded-lg bg-[#1E293B] border border-[#334155] text-white text-sm"
                              />
                              <select
                                value={requestEditForm.time}
                                onChange={(e) => setRequestEditForm((prev) => ({ ...prev, time: e.target.value }))}
                                className="h-10 px-3 rounded-lg bg-[#1E293B] border border-[#334155] text-white text-sm"
                              >
                                <option value="">Select Time</option>
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
                            <div className="flex items-center gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingRequestId('')}
                                className="px-3 py-1.5 text-xs rounded-md border border-[#334155] text-gray-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveMyRequest(request.requestId)}
                                disabled={savingRequestId === request.requestId}
                                className="px-3 py-1.5 text-xs rounded-md bg-[#10B981] text-white disabled:opacity-60"
                              >
                                {savingRequestId === request.requestId ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-200 font-medium">
                              {request.pickupLocation} to {request.destinationLocation}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(request.departureTime)} at {request.timeLabel || formatTime(request.departureTime)}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs text-amber-300 uppercase tracking-wider">{request.status}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFindPartnerForMyRequest(request)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[#0EA5E9]/20 border border-[#0EA5E9]/50 text-[#7DD3FC] hover:bg-[#0EA5E9]/30"
                                >
                                  <Search className="w-3 h-3" />
                                  Find Partner
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditMyRequest(request)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-[#334155] text-gray-200 hover:border-[#10B981]"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMyRequest(request.requestId)}
                                  disabled={deletingRequestId === request.requestId}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  {deletingRequestId === request.requestId ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!showPartnerFinder && (
        /* Results Section */
        <div className="max-w-2xl mx-auto mt-12 space-y-6">
          {bookingSuccess && (
            <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 text-[#A7F3D0] text-sm rounded-xl">
              {bookingSuccess}
            </div>
          )}

          {bookingError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl">
              {bookingError}
            </div>
          )}

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

              {filteredRides.map((ride) => {
                const availableSeats = ride.seatsTotal - (ride.seatsBooked || 0);
                const isBooking = bookingRideId === ride._id;
                const alreadyRequested = ride.hasRequested === true;
                const isFull = availableSeats <= 0;

                return (
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
                             <p className="text-sm font-bold text-[#C7D2FE] mb-1">{formatDate(ride.departureTime)}</p>
                             <p className="text-xs text-gray-500 mb-2">{formatTime(ride.departureTime)}</p>
                             <div className="relative mb-1">
                               <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#4F46E5] border-2 border-[#1E293B]"></div>
                               <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pickup</p>
                             </div>
                             <p className="text-white text-sm font-semibold line-clamp-1">{ride.origin?.placeName || ride.origin?.address}</p>
                             {ride.origin?.placeName && ride.origin?.address && ride.origin.placeName !== ride.origin.address && (
                               <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ride.origin.address}</p>
                             )}
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
                         <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-[#334155]/30 px-2 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{ride.routeData?.durationMin || 45} min</span>
                            </div>
                             <div className="flex items-center gap-1.5 bg-[#334155]/30 px-2 py-1 rounded-lg">
                                <User className="w-3.5 h-3.5" />
                                <span>{availableSeats} seats</span>
                            </div>
                            {ride.preferences?.multipleStoppages === true && (
                              <div className="flex items-center gap-1.5 bg-[#10B981]/20 px-2 py-1 rounded-lg text-[#10B981] text-xs font-medium">
                                <span>✓ Stoppages</span>
                              </div>
                            )}
                            {ride.preferences?.expressway === true && (
                              <div className="flex items-center gap-1.5 bg-[#F59E0B]/20 px-2 py-1 rounded-lg text-[#F59E0B] text-xs font-medium">
                                <span>✓ Expressway</span>
                              </div>
                            )}
                         </div>
                         <button
                           onClick={() => handleBookRide(ride)}
                           disabled={isBooking || alreadyRequested || isFull}
                           className="bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           {isBooking ? 'Booking...' : alreadyRequested ? 'Requested' : isFull ? 'Full' : 'Book Ride'}
                           {!isBooking && <ArrowRight className="w-4 h-4" />}
                         </button>
                    </div>
                </div>
                )})}
        </div>
              )}
    </div>
  );
};

export default HopperMode;
