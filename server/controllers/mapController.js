const { getMapProvider } = require('../services/maps');
// Factory Pattern - Import map provider factory
const MapProviderFactory = require('../patterns/Factory');

const getRoute = async (req, res) => {
  try {
    const { origin, destination, providerType } = req.body; // Expect arrays [lng, lat] (Mongo)

    // Factory Pattern - Create provider dynamically based on type
    const provider = providerType 
      ? MapProviderFactory.createProvider(providerType, {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
          referer: process.env.REFERER_URL
        })
      : getMapProvider();
    
    const route = await provider.getRoute({ origin, destination });

    res.json(route);

  } catch (error) {
    console.error('Map Controller Error:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: 'Failed to calculate route' });
  }
};

module.exports = { getRoute };