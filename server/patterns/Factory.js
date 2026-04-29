/**
 * Factory Pattern - Map Provider Factory
 * Creates map provider instances based on configuration
 */
const GoogleMapsAdapter = require('../services/maps/GoogleMapsAdapter');

class MapProviderFactory {
  static createProvider(type, config) {
    switch (type) {
      case 'google':
        return new GoogleMapsAdapter(config);
      case 'mapbox':
        return this.createMapboxProvider(config);
      case 'osrm':
        return this.createOSRMProvider(config);
      default:
        throw new Error(`Unknown map provider type: ${type}`);
    }
  }

  static createGoogleProvider(config) {
    return new GoogleMapsAdapter(config);
  }

  static createMapboxProvider(config) {
    // Placeholder for Mapbox implementation
    const MapboxProvider = require('./MapboxProvider');
    return new MapboxProvider(config);
  }

  static createOSRMProvider(config) {
    // Placeholder for OSRM implementation
    const OSRMProvider = require('./OSRMProvider');
    return new OSRMProvider(config);
  }

  static getDefaultProvider() {
    return this.createProvider('google', {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
      referer: process.env.REFERER_URL || 'http://localhost:5173/'
    });
  }
}

module.exports = MapProviderFactory;