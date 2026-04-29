const { getMapProvider } = require('../services/maps');

const getRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body; // Expect arrays [lng, lat] (Mongo)

    const provider = getMapProvider();
    const route = await provider.getRoute({ origin, destination });

    res.json(route);

  } catch (error) {
    console.error('Map Controller Error:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: 'Failed to calculate route' });
  }
};

module.exports = { getRoute };