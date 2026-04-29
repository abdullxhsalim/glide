/**
 * Facade Pattern - Client Service Facade
 * Provides simplified API interactions for the client
 */

// Base API URL
const API_BASE = '/api';

/**
 * Ride Service Facade - Simplifies ride-related API calls
 */
class RideServiceFacade {
  async getRides(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/rides?${params}`, {
      headers: this._getAuthHeaders()
    });
    return this._handleResponse(response);
  }

  async createRide(rideData) {
    const response = await fetch(`${API_BASE}/rides`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify(rideData)
    });
    return this._handleResponse(response);
  }

  async getMyRides() {
    const response = await fetch(`${API_BASE}/rides/mine`, {
      headers: this._getAuthHeaders()
    });
    return this._handleResponse(response);
  }

  async updateRide(rideId, updates) {
    const response = await fetch(`${API_BASE}/rides/${rideId}`, {
      method: 'PUT',
      headers: this._getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return this._handleResponse(response);
  }

  async deleteRide(rideId) {
    const response = await fetch(`${API_BASE}/rides/${rideId}`, {
      method: 'DELETE',
      headers: this._getAuthHeaders()
    });
    return this._handleResponse(response);
  }

  _getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async _handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }
    return data;
  }
}

/**
 * Booking Service Facade - Simplifies booking-related API calls
 */
class BookingServiceFacade {
  async createBooking(bookingData) {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    return this._handleResponse(response);
  }

  async getMyBookings() {
    const response = await fetch(`${API_BASE}/bookings/mine`, {
      headers: this._getAuthHeaders()
    });
    return this._handleResponse(response);
  }

  async updateBookingStatus(bookingId, status) {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return this._handleResponse(response);
  }

  _getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async _handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }
    return data;
  }
}

/**
 * Map Service Facade - Simplifies map-related API calls
 */
class MapServiceFacade {
  async getRoute(origin, destination) {
    const response = await fetch(`${API_BASE}/maps/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination })
    });
    return this._handleResponse(response);
  }

  async _handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Map API Error');
    }
    return data;
  }
}

// Singleton instances
let rideServiceInstance = null;
let bookingServiceInstance = null;
let mapServiceInstance = null;

export const getRideService = () => {
  if (!rideServiceInstance) {
    rideServiceInstance = new RideServiceFacade();
  }
  return rideServiceInstance;
};

export const getBookingService = () => {
  if (!bookingServiceInstance) {
    bookingServiceInstance = new BookingServiceFacade();
  }
  return bookingServiceInstance;
};

export const getMapService = () => {
  if (!mapServiceInstance) {
    mapServiceInstance = new MapServiceFacade();
  }
  return mapServiceInstance;
};

export { RideServiceFacade, BookingServiceFacade, MapServiceFacade };