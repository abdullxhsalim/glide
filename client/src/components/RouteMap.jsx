import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const RouteMap = ({ origin, destination, geometry, isLoaded, onMapClick, driverLocation }) => {
  const [map, setMap] = useState(null);

  const onLoad = useCallback((mapInstance) => { setMap(mapInstance); }, []);
  const onUnmount = useCallback(() => { setMap(null); }, []);

  const path = useMemo(() => {
    if (!isLoaded || !geometry || !window.google) return [];
    try {
      return window.google.maps.geometry.encoding.decodePath(geometry);
    } catch (e) {
      return [];
    }
  }, [isLoaded, geometry]);

  const originCoords = useMemo(() => {
    if (origin && Array.isArray(origin) && origin.length === 2 && !isNaN(origin[0]) && !isNaN(origin[1])) {
      return { lng: origin[0], lat: origin[1] };
    }
    return null;
  }, [origin]);

  const destCoords = useMemo(() => {
    if (destination && Array.isArray(destination) && destination.length === 2 && !isNaN(destination[0]) && !isNaN(destination[1])) {
      return { lng: destination[0], lat: destination[1] };
    }
    return null;
  }, [destination]);

  const driverCoords = useMemo(() => {
    if (driverLocation && Array.isArray(driverLocation) && driverLocation.length === 2) {
      return { lng: driverLocation[0], lat: driverLocation[1] };
    }
    return null;
  }, [driverLocation]);

  const defaultCenter = { lat: 23.8103, lng: 90.4125 };

  useEffect(() => {
    if (map && isLoaded && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;
      if (originCoords) { bounds.extend(originCoords); hasPoints = true; }
      if (destCoords) { bounds.extend(destCoords); hasPoints = true; }
      if (path && path.length > 0) {
        path.forEach(p => bounds.extend(p));
        hasPoints = true;
      }
      if (hasPoints) {
        map.fitBounds(bounds);
        const listener = window.google.maps.event.addListener(map, "idle", () => { 
          if (map.getZoom() > 14) map.setZoom(14); 
          window.google.maps.event.removeListener(listener); 
        });
      } else {
        map.setCenter(defaultCenter);
        map.setZoom(12);
      }
    }
  }, [map, originCoords, destCoords, path, isLoaded]);

  if (!isLoaded) return <div className="w-full h-full flex items-center justify-center bg-[#1E293B] text-white">Loading map...</div>;

  return (
    <GoogleMap 
      mapContainerStyle={containerStyle} 
      zoom={12} 
      center={defaultCenter}
      options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
      onLoad={onLoad} 
      onUnmount={onUnmount}
      onClick={onMapClick}
    >
      {path.length > 0 && (
        <Polyline path={path} options={{ strokeColor: '#10B981', strokeOpacity: 0.8, strokeWeight: 5 }} />
      )}
      {originCoords && (
         <Marker position={originCoords} icon={{ url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2310B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"%3E%3C/path%3E%3Ccircle cx="12" cy="10" r="3"%3E%3C/circle%3E%3C/svg%3E', scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 32) }} />
      )}
      {destCoords && (
         <Marker position={destCoords} icon={{ url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"%3E%3C/path%3E%3Ccircle cx="12" cy="10" r="3"%3E%3C/circle%3E%3C/svg%3E', scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 32) }} />
      )}
      {driverCoords && (
         <Marker position={driverCoords} icon={{ url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="11" width="18" height="10" rx="2"%3E%3C/rect%3E%3Ccircle cx="7" cy="21" r="2"%3E%3C/circle%3E%3Ccircle cx="17" cy="21" r="2"%3E%3C/circle%3E%3Cpath d="M3 11v-3l4-5h10l4 5v3"%3E%3C/path%3E%3C/svg%3E', scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 16) }} />
      )}
    </GoogleMap>
  );
};

export default RouteMap;
