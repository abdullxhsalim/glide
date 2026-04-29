/**
 * Builder Pattern - Complex Object Builder
 * Constructs complex ride/booking objects step by step
 */

class RideBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this._ride = {
      origin: null,
      destination: null,
      departureTime: null,
      seatsTotal: 1,
      pricePerSeat: 0,
      totalFuelCost: 0,
      status: 'scheduled',
      driver: null,
      notes: ''
    };
  }

  setOrigin(origin) {
    this._ride.origin = origin;
    return this;
  }

  setDestination(destination) {
    this._ride.destination = destination;
    return this;
  }

  setDepartureTime(time) {
    this._ride.departureTime = time;
    return this;
  }

  setSeats(seats) {
    this._ride.seatsTotal = seats;
    return this;
  }

  setPricePerSeat(price) {
    this._ride.pricePerSeat = price;
    return this;
  }

  setTotalFuelCost(cost) {
    this._ride.totalFuelCost = cost;
    return this;
  }

  setDriver(driverId) {
    this._ride.driver = driverId;
    return this;
  }

  setStatus(status) {
    this._ride.status = status;
    return this;
  }

  setNotes(notes) {
    this._ride.notes = notes;
    return this;
  }

  build() {
    const result = { ...this._ride };
    this.reset();
    return result;
  }
}

class BookingBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this._booking = {
      rider: null,
      driver: null,
      ride: null,
      seatsBooked: 1,
      status: 'pending',
      tripPrice: 0,
      pickupLocation: null,
      dropoffLocation: null,
      notes: ''
    };
  }

  setRider(riderId) {
    this._booking.rider = riderId;
    return this;
  }

  setDriver(driverId) {
    this._booking.driver = driverId;
    return this;
  }

  setRide(rideId) {
    this._booking.ride = rideId;
    return this;
  }

  setSeatsBooked(seats) {
    this._booking.seatsBooked = seats;
    return this;
  }

  setStatus(status) {
    this._booking.status = status;
    return this;
  }

  setTripPrice(price) {
    this._booking.tripPrice = price;
    return this;
  }

  setPickupLocation(location) {
    this._booking.pickupLocation = location;
    return this;
  }

  setDropoffLocation(location) {
    this._booking.dropoffLocation = location;
    return this;
  }

  setNotes(notes) {
    this._booking.notes = notes;
    return this;
  }

  build() {
    const result = { ...this._booking };
    this.reset();
    return result;
  }
}

module.exports = {
  RideBuilder,
  BookingBuilder
};