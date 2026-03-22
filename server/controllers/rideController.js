const Ride = require('../models/Ride');

// @desc    Get all available rides
// @route   GET /api/rides
// @access  Public (or Private?) - Let's keep it public for now to view available rides
const getRides = async (req, res) => {
  try {
    // Basic filter: Only scheduled rides that haven't departed yet
    const rides = await Ride.find({ 
      status: 'scheduled',
      departureTime: { $gte: new Date() } 
    })
    .populate('driver', 'name rating vehicle') // Get driver details
    .sort({ departureTime: 1 }); // Sort by soonest

    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private
const createRide = async (req, res) => {
    // For now, we are just focusing on fetching, but skeleton for creation is good
    try {
        const { origin, destination, departureTime, seatsTotal, totalFuelCost, vehicle, preferences, routeData } = req.body;

        // Basic validation
        if (!origin || !destination || !departureTime || !seatsTotal || !totalFuelCost) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        // Calculate initial price per seat (assuming full capacity + driver)
        // Or leave it undefined until booked? Let's verify the user's intent.
        // User said: "price is basically the fuel cost divided by the number of people who is in the ride"
        // At creation, only the driver is in the ride. So cost is technically 100% driver.
        // But for sorting/display, we might want the *optimal* price.
        // Let's store totalFuelCost primarily.

        const ride = await Ride.create({
            driver: req.user.id, // Assumes auth middleware adds user to req
            origin,
            destination,
            departureTime,
            seatsTotal,
            totalFuelCost,
            routeData: routeData || {},
            // Calculate a baseline price for sorting/display purposes (e.g. if car is full)
            pricePerSeat: Math.floor(totalFuelCost / (parseInt(seatsTotal) + 1)), 
            preferences: preferences || {},
            vehicle: vehicle || req.user.vehicle // Use user's vehicle if not specified
        });

        res.status(201).json(ride);
    } catch (error) {
        console.error('Error creating ride:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = {
  getRides,
  createRide
};