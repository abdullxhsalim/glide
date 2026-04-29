/**
 * Decorator Pattern - Feature Decorators
 * Adds functionality to existing objects without modifying them
 */

// Base Ride class
class Ride {
  constructor(data) {
    this.id = data.id;
    this.origin = data.origin;
    this.destination = data.destination;
    this.driver = data.driver;
  }

  getInfo() {
    return {
      id: this.id,
      origin: this.origin,
      destination: this.destination
    };
  }
}

// Decorator: Verified Driver Feature
class VerifiedDriverDecorator {
  constructor(ride) {
    this.ride = ride;
  }

  getInfo() {
    return {
      ...this.ride.getInfo(),
      verifiedDriver: true,
      verificationBadge: '✓ Verified'
    };
  }
}

// Decorator: Premium Vehicle Feature
class PremiumVehicleDecorator {
  constructor(ride) {
    this.ride = ride;
  }

  getInfo() {
    return {
      ...this.ride.getInfo(),
      vehicleClass: 'premium',
      amenities: ['WiFi', 'Charging Ports', 'AC']
    };
  }
}

// Decorator: Eco-Friendly Feature
class EcoFriendlyDecorator {
  constructor(ride) {
    this.ride = ride;
  }

  getInfo() {
    return {
      ...this.ride.getInfo(),
      ecoFriendly: true,
      carbonOffset: true,
      vehicleType: 'electric'
    };
  }
}

// Decorator: Women-Only Ride Feature
class WomenOnlyDecorator {
  constructor(ride) {
    this.ride = ride;
  }

  getInfo() {
    return {
      ...this.ride.getInfo(),
      womenOnly: true,
      safetyFeatures: ['Dashcam', 'In-app emergency', 'Share trip status']
    };
  }
}

// Factory function to apply decorators
function decorateRide(baseRide, features) {
  let decoratedRide = baseRide;

  if (features.verifiedDriver) {
    decoratedRide = new VerifiedDriverDecorator(decoratedRide);
  }
  if (features.premium) {
    decoratedRide = new PremiumVehicleDecorator(decoratedRide);
  }
  if (features.ecoFriendly) {
    decoratedRide = new EcoFriendlyDecorator(decoratedRide);
  }
  if (features.womenOnly) {
    decoratedRide = new WomenOnlyDecorator(decoratedRide);
  }

  return decoratedRide;
}

module.exports = {
  Ride,
  VerifiedDriverDecorator,
  PremiumVehicleDecorator,
  EcoFriendlyDecorator,
  WomenOnlyDecorator,
  decorateRide
};