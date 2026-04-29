/**
 * Strategic Pattern - Pricing Strategies
 * Different pricing algorithms that can be swapped at runtime
 */

// Strategy Interface
class PricingStrategy {
  calculate(ride) {
    throw new Error('calculate must be implemented');
  }
}

// Concrete Strategy: Distance-based pricing
class DistancePricingStrategy extends PricingStrategy {
  constructor(baseRate = 2.0, perKmRate = 1.5) {
    super();
    this.baseRate = baseRate;
    this.perKmRate = perKmRate;
  }

  calculate(ride) {
    const distanceKm = ride.distance || 0;
    return this.baseRate + (distanceKm * this.perKmRate);
  }
}

// Concrete Strategy: Time-based pricing
class TimePricingStrategy extends PricingStrategy {
  constructor(baseRate = 3.0, perMinuteRate = 0.5) {
    super();
    this.baseRate = baseRate;
    this.perMinuteRate = perMinuteRate;
  }

  calculate(ride) {
    const durationMinutes = (ride.duration || 0) / 60;
    return this.baseRate + (durationMinutes * this.perMinuteRate);
  }
}

// Concrete Strategy: Dynamic pricing (surge)
class DynamicPricingStrategy extends PricingStrategy {
  constructor(baseStrategy, surgeMultiplier = 1.0) {
    super();
    this.baseStrategy = baseStrategy;
    this.surgeMultiplier = surgeMultiplier;
  }

  calculate(ride) {
    const basePrice = this.baseStrategy.calculate(ride);
    return basePrice * this.surgeMultiplier;
  }

  setSurge(multiplier) {
    this.surgeMultiplier = multiplier;
  }
}

// Context that uses strategies
class PricingContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  calculatePrice(ride) {
    return this.strategy.calculate(ride);
  }
}

module.exports = {
  PricingStrategy,
  DistancePricingStrategy,
  TimePricingStrategy,
  DynamicPricingStrategy,
  PricingContext
};