// Simulating a real-time fuel price API interaction
// In a real app, this would fetch from a reliable government or third-party source
// Current approximate prices in Bangladesh (Oct 2025 proj.)

export const FUEL_PRICES = {
  octane: 130, // BDT per Liter
  petrol: 125,
  diesel: 109,
  cng: 43, // BDT per m3 (handled slightly differently but for simplicity treating as unit)
  hybrid: 130 // Assume Octane base for hybrid
};

// Strategic Pattern - Pricing Strategies
export class PricingStrategy {
  calculate(ride) {
    throw new Error('calculate must be implemented');
  }
}

export class DistancePricingStrategy extends PricingStrategy {
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

export class TimePricingStrategy extends PricingStrategy {
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

export class DynamicPricingStrategy extends PricingStrategy {
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
export class PricingContext {
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

export const fetchFuelPrice = async (type) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const price = FUEL_PRICES[type.toLowerCase()] || 130;
  return price;
};

// Google Maps Directions API via Backend Proxy
export const getRouteDetails = async (originCoords, destCoords) => {
  try {
    // originCoords and destCoords are [lng, lat] (Mongo format)
    
    const response = await fetch('/api/maps/route', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            origin: originCoords,
            destination: destCoords
        })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Route calculation failed');
    }

    return {
      distanceMeter: data.distanceMeter, 
      durationSeconds: data.durationSeconds, 
      geometry: data.geometry // Encoded polyline string (different from OSRM's GeoJSON)
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback? Or just fail? Let's fail for now so user knows key is missing if applicable
    return null; 
  }
};
