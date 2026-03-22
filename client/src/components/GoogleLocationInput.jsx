import React, { useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const GoogleLocationInput = ({ 
  label, 
  value, 
  onChange, 
  onPlaceSelected, 
  isLoaded,
  placeholder = "Search location...",
  icon: Icon = MapPin 
}) => {
  const autocompleteRef = useRef(null);

  const onLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name;
        
        onPlaceSelected({
            address,
            lat,
            lng,
            place_id: place.place_id
        });
      } else {
        // Fallback if user just typed text but didn't select from dropdown
        // In a real app, you might want to force selection or Geocode this text manually
        console.warn("No geometry found for place", place);
      }
    } 
  };

  if (!isLoaded) {
      return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative animate-pulse">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-600 rounded-full z-10"></div>
                <div className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 flex items-center">
                    <span className="text-gray-500 text-sm">Loading Maps...</span>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10 pointer-events-none" />
            <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                restrictions={{ country: "bd" }} 
            >
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] placeholder-gray-500 transition-colors"
                />
            </Autocomplete>
        </div>
    </div>
  );
};

export default GoogleLocationInput;