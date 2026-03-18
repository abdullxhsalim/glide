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
        const { origin, destination, departureTime, seatsTotal, pricePerSeat, vehicle } = req.body;

        // Basic validation
        if (!origin || !destination || !departureTime || !seatsTotal || !pricePerSeat) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        const ride = await Ride.create({
            driver: req.user.id, // Assumes auth middleware adds user to req
            origin,
            destination,
            departureTime,
            seatsTotal,
            pricePerSeat,
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