/**
 * Facade Pattern - Service Facade
 * Provides a simplified interface to complex subsystems
 */

const MapProviderFactory = require('./Factory');
const { PricingContext, DistancePricingStrategy } = require('./Strategy');
const { bookingObserver } = require('./Observer');
const { RideBuilder, BookingBuilder } = require('./Builder');

class RideServiceFacade {
  constructor() {
    this.mapProvider = MapProviderFactory.getDefaultProvider();
    this.pricingContext = new PricingContext(new DistancePricingStrategy());
  }

  // Simplified method to create a complete ride
  async createRide(rideData) {
    const builder = new RideBuilder();
    
    const ride = builder
      .setOrigin(rideData.origin)
      .setDestination(rideData.destination)
      .setDepartureTime(rideData.departureTime)
      .setSeats(rideData.seats)
      .setDriver(rideData.driverId)
      .setNotes(rideData.notes || '')
      .build();

    // Calculate route and pricing
    try {
      const route = await this.mapProvider.getRoute({
        origin: rideData.origin.coordinates,
        destination: rideData.destination.coordinates
      });

      ride.distance = route.distanceMeter / 1000;
      ride.duration = route.durationSeconds;
      ride.geometry = route.geometry;

      // Calculate price
      ride.pricePerSeat = this.pricingContext.calculatePrice(ride);
      ride.totalFuelCost = ride.pricePerSeat * ride.seats;

      return ride;
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error;
    }
  }

  // Simplified method to create a booking
  async createBooking(bookingData) {
    const builder = new BookingBuilder();
    
    const booking = builder
      .setRider(bookingData.riderId)
      .setDriver(bookingData.driverId)
      .setRide(bookingData.rideId)
      .setSeatsBooked(bookingData.seatsBooked || 1)
      .setPickupLocation(bookingData.pickupLocation)
      .setDropoffLocation(bookingData.dropoffLocation)
      .setNotes(bookingData.notes || '')
      .build();

    // Notify observers
    bookingObserver.notify({
      type: 'BOOKING_CREATED',
      bookingId: booking._id,
      riderId: booking.rider,
      driverId: booking.driver,
      status: booking.status
    });

    return booking;
  }

  // Get route information
  async getRouteInfo(origin, destination) {
    return this.mapProvider.getRoute({ origin, destination });
  }

  // Calculate price
  calculatePrice(rideData) {
    return this.pricingContext.calculatePrice(rideData);
  }
}

// Singleton instance
let rideServiceFacadeInstance = null;

function getRideServiceFacade() {
  if (!rideServiceFacadeInstance) {
    rideServiceFacadeInstance = new RideServiceFacade();
  }
  return rideServiceFacadeInstance;
}

module.exports = {
  RideServiceFacade,
  getRideServiceFacade
};