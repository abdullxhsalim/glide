const GoogleMapsAdapter = require('./GoogleMapsAdapter');

const getMapProvider = () => {
  const provider = (process.env.MAPS_PROVIDER || 'google').trim().toLowerCase();

  switch (provider) {
    case 'google':
    default:
      return new GoogleMapsAdapter({
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
        referer: process.env.GOOGLE_MAPS_REFERER
      });
  }
};

module.exports = { getMapProvider };
