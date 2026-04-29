const MapProvider = require('./MapProvider');

class GoogleMapsAdapter extends MapProvider {
  constructor({ apiKey, referer } = {}) {
    super();
    this.apiKey = (apiKey || '').trim();
    this.referer = referer || 'http://localhost:5173/';
  }

  formatCoord(coord) {
    if (Array.isArray(coord) && coord.length === 2) {
      // Swap: lng,lat -> lat,lng
      return `${coord[1]},${coord[0]}`;
    }
    return coord;
  }

  async getRoute({ origin, destination, mode = 'driving' }) {
    if (!this.apiKey) {
      const error = new Error('Google Maps API key missing');
      error.statusCode = 500;
      throw error;
    }

    const o = this.formatCoord(origin);
    const d = this.formatCoord(destination);
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${o}&destination=${d}&mode=${mode}&key=${this.apiKey}`;

    const response = await fetch(url, {
      headers: {
        Referer: this.referer
      }
    });

    const data = await response.json();

    if (data.status !== 'OK') {
      const error = new Error(data.error_message || 'Failed to fetch route from Google Maps');
      error.statusCode = 502;
      error.details = data;
      throw error;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distanceMeter: leg.distance.value,
      durationSeconds: leg.duration.value,
      geometry: route.overview_polyline.points,
      summary: route.summary
    };
  }
}

module.exports = GoogleMapsAdapter;
