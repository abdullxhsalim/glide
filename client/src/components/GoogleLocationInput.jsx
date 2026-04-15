import React, { useRef, useEffect, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const GoogleLocationInput = ({ 
  label, 
  value, 
  onChange, 
  onPlaceSelected, 
  isLoaded,
  placeholder = "Search location...",
  icon: Icon = MapPin,
  className
}) => {
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const [selectedInputValue, setSelectedInputValue] = useState('');
  
  const handleInputChange = (e) => {
      const val = e.target.value;
      setSelectedInputValue(val); // Capture what user is typing
      if (onChange) {
          onChange(val);
      }
  };


  const onLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const extractPlaceName = (place) => {
    const input = inputRef.current?.value?.trim() || '';
    
    console.log('DEBUG: Extracting from:', { input, placeName: place.name, formatted: place.formatted_address });
    
    // Priority 1: Look for point_of_interest in address_components (most reliable for landmarks)
    if (place.address_components) {
      const poi = place.address_components.find(c => c.types?.includes('point_of_interest'));
      if (poi?.long_name) {
        console.log('DEBUG: Found POI:', poi.long_name);
        return poi.long_name;
      }
      
      // Try to find an establishment or landmark
      const meaningful = place.address_components.find(
        c => c.types?.includes('establishment') || c.types?.includes('landmark')
      );
      if (meaningful?.long_name) {
        console.log('DEBUG: Found establishment:', meaningful.long_name);
        return meaningful.long_name;
      }
    }
    
    // Priority 2: Try to extract from input text (what user selected)
    if (input && input.length > 2) {
      const parts = input.split(',');
      
      // Try each part, starting from the longest/first, looking for one that's not just an address
      for (const part of parts) {
        const trimmed = part.trim();
        // Skip pure address-like patterns and very short parts
        if (trimmed.length > 3 && !trimmed.match(/^plot|^house|^road|^street|^block|^avenue|^lane|^no\.?[\s\d]|^\d+/i)) {
          console.log('DEBUG: Using input part:', trimmed);
          return trimmed;
        }
      }
      
      // If first part looks like address (Plot, House), try second part
      if (parts[1]) {
        const secondPart = parts[1].trim();
        if (secondPart.length > 3 && !secondPart.match(/^dhaka|^bangladesh|^\d+/i)) {
          console.log('DEBUG: Using second part:', secondPart);
          return secondPart;
        }
      }
    }
    
    // Priority 3: Use formatted_address and extract first non-address part
    if (place.formatted_address) {
      const parts = place.formatted_address.split(',').map(p => p.trim());
      
      // Look for a part that's not just a number or city name
      for (const part of parts) {
        if (part.length > 3 && !part.match(/^plot|^house|^road|^street|^block|^avenue|^lane|^no\.|^level|^\d+|^dhaka|^bangladesh/i)) {
          console.log('DEBUG: Using formatted_address part:', part);
          return part;
        }
      }
      
      // Fallback: if nothing found, return first part if it's not too address-like
      const firstPart = parts[0];
      if (firstPart && !firstPart.match(/^plot|^house|^road|^street/i)) {
        console.log('DEBUG: Using first part as fallback:', firstPart);
        return firstPart;
      }
    }
    
    // Last resort: use place.name
    console.log('DEBUG: Using place.name fallback:', place.name);
    return place.name || input || '';
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address;
        
        // Extract meaningful place name, prioritizing point_of_interest (like "North South University")
        const name = extractPlaceName(place);
        
        onPlaceSelected({
            name,
            address,
            lat,
            lng,
            place_id: place.place_id
        });
      } else {
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
        {label && <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10 pointer-events-none" />}
            <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  componentRestrictions: { country: 'bd' },
                  fields: ['place_id', 'name', 'formatted_address', 'address_components', 'geometry']
                }}
            >
                <input
                  ref={inputRef}
                    type="text"
                    value={value || ''}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className={className || "w-full h-[52px] bg-[#1E293B] border border-[#334155] rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-[#4F46E5] placeholder-gray-500 transition-colors"}
                />
            </Autocomplete>
        </div>
    </div>
  );
};

export default GoogleLocationInput;