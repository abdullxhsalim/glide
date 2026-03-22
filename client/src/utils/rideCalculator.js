// Simulating a real-time fuel price API interaction
// In a real app, this would fetch from a reliable government or third-party source
// Current approximate prices in Bangladesh (Oct 2025 proj.)

export const FUEL_PRICES = {
  octane: 130, // BDT per Liter
  petrol: 125,
  diesel: 109,
  cng: 43, // BDT per m3 (handled slightly differently but for simplicity treating as unit)
  hybrid: 130 // Assume Octane base for hybrid
};

export const fetchFuelPrice = async (type) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const price = FUEL_PRICES[type.toLowerCase()] || 130;
  return price;
};

// Google Maps Directions API via Backend Proxy
export const getRouteDetails = async (originCoords, destCoords) => {
  try {
    // originCoords and destCoords are [lng, lat] (Mongo format)
    
    const response = await fetch('/api/maps/route', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            origin: originCoords,
            destination: destCoords
        })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Route calculation failed');
    }

    return {
      distanceMeter: data.distanceMeter, 
      durationSeconds: data.durationSeconds, 
      geometry: data.geometry // Encoded polyline string (different from OSRM's GeoJSON)
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback? Or just fail? Let's fail for now so user knows key is missing if applicable
    return null; 
  }
};
