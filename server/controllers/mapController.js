const getRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body; // Expect arrays [lng, lat] (Mongo)

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('SERVER: Missing Google Maps API Key in .env');
      return res.status(500).json({ message: 'Server configuration error: Google Maps API key missing' });
    }

    // Mongo GeoJSON: [longitude, latitude]
    // Google Maps API: "latitude,longitude"
    
    const formatCoord = (coord) => {
        if (Array.isArray(coord) && coord.length === 2) {
            // Swap: lng,lat -> lat,lng
            return `${coord[1]},${coord[0]}`; 
        }
        return coord;
    };

    const o = formatCoord(origin);
    const d = formatCoord(destination);

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${o}&destination=${d}&mode=driving&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url, {
        headers: {
            'Referer': 'http://localhost:5173/' 
        }
    });
    const data = await response.json();

    if (data.status !== 'OK') {
       console.error('Google Maps API Error:', data);
       throw new Error(data.error_message || 'Failed to fetch route from Google Maps');
    }

    const route = data.routes[0];
    const leg = route.legs[0]; // Assuming direct single leg for now

    res.json({
        distanceMeter: leg.distance.value,
        durationSeconds: leg.duration.value,
        geometry: route.overview_polyline.points, // Encoded polyline string
        summary: route.summary
    });

  } catch (error) {
    console.error('Map Controller Error:', error.message);
    res.status(500).json({ message: 'Failed to calculate route' });
  }
};

module.exports = { getRoute };