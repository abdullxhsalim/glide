const GoogleMapsAdapter = require('./GoogleMapsAdapter');
// Adapter Pattern - Import the enhanced adapter
const MapServiceAdapter = require('../../patterns/Adapter');

// Cache-enabled map provider (Adapter Pattern)
let cachedProvider = null;

const getMapProvider = () => {
  const provider = (process.env.MAPS_PROVIDER || 'google').trim().toLowerCase();

  let baseProvider;
  switch (provider) {
    case 'google':
    default:
      baseProvider = new GoogleMapsAdapter({
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
        referer: process.env.GOOGLE_MAPS_REFERER
      });
  }

  // Wrap with Adapter Pattern for caching and enhanced features
  if (!cachedProvider) {
    cachedProvider = new MapServiceAdapter(baseProvider);
  }

  return cachedProvider;
};

module.exports = { getMapProvider };
