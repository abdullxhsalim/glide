import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Custom Dark Mode Style
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const RouteMap = ({ origin, destination, geometry, isLoaded, onMapClick }) => {
  const [map, setMap] = useState(null);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const path = useMemo(() => {
    if (!isLoaded || !geometry || !window.google) return [];
    try {
      return window.google.maps.geometry.encoding.decodePath(geometry);
    } catch (error) {
      console.error("Error decoding polyline:", error);
      return [];
    }
  }, [isLoaded, geometry]);

  useEffect(() => {
    if (isLoaded && map && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;

      if (path.length > 0) {
        path.forEach((point) => bounds.extend(point));
        hasPoints = true;
      } 
      
      if (origin) {
         bounds.extend({ lat: origin[1], lng: origin[0] });
         hasPoints = true;
      }
      if (destination) {
         bounds.extend({ lat: destination[1], lng: destination[0] });
         hasPoints = true;
      }

      if (hasPoints) {
          map.fitBounds(bounds);
      }
    }
  }, [isLoaded, map, path, origin, destination]);

  const defaultCenter = { lat: 23.8103, lng: 90.4125 };

  if (!isLoaded) {
    return (
      <div className="h-64 w-full rounded-xl bg-[#1E293B] animate-pulse flex items-center justify-center border border-[#334155]">
        <span className="text-gray-500 font-medium">Loading Google Maps...</span>
      </div>
    );
  }

  const originPos = origin ? { lat: origin[1], lng: origin[0] } : null;
  const destPos = destination ? { lat: destination[1], lng: destination[0] } : null;

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-[#334155] shadow-lg relative z-0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          disableDefaultUI: true,
          styles: mapStyles,
          streetViewControl: false,
          mapTypeControl: false
        }}
      >
        {path.length > 0 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "#4F46E5",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
        )}
        
        {originPos && <Marker position={originPos} label={{text: "A", color: "white", fontWeight: "bold"}} />}
        {destPos && <Marker position={destPos} label={{text: "B", color: "white", fontWeight: "bold"}} />}

      </GoogleMap>
    </div>
  );
};

export default React.memo(RouteMap);