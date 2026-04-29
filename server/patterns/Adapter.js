/**
 * Adapter Pattern - Enhanced Map Adapter
 * Wraps existing GoogleMapsAdapter with additional functionality
 */
const GoogleMapsAdapter = require('../services/maps/GoogleMapsAdapter');

class MapServiceAdapter {
  constructor(mapProvider) {
    this.provider = mapProvider;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getRouteWithCache({ origin, destination, mode = 'driving' }) {
    const cacheKey = `${origin[0]},${origin[1]}-${destination[0]},${destination[1]}-${mode}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.data, cached: true };
    }

    const result = await this.provider.getRoute({ origin, destination, mode });
    
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return { ...result, cached: false };
  }

  async getRouteWithAlternatives({ origin, destination, mode = 'driving' }) {
    const modes = ['driving', 'walking', 'bicycling'];
    const results = await Promise.all(
      modes.map(m => this.provider.getRoute({ origin, destination, mode: m }))
        .catch(() => null)
    );

    return results.filter(r => r !== null);
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = MapServiceAdapter;