const Booking = require('../models/Booking');
const Ride = require('../models/Ride');

// @desc    Hopper creates a booking request for a ride
// @route   POST /api/bookings
// @access  Private (rider)
const createBookingRequest = async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Only hoppers can request a ride' });
    }

    const { rideId, seatsBooked = 1, pickupLocation, dropoffLocation, notes } = req.body;

    if (!rideId) {
      return res.status(400).json({ message: 'rideId is required' });
    }

    const requestedSeats = Number(seatsBooked);
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
      return res.status(400).json({ message: 'seatsBooked must be a positive integer' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled rides can be booked' });
    }

    if (ride.driver.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'Driver cannot book own ride' });
    }

    const availableSeats = ride.seatsTotal - (ride.seatsBooked || 0);
    if (requestedSeats > availableSeats) {
      return res.status(400).json({ message: `Only ${availableSeats} seats available` });
    }

    const existing = await Booking.findOne({ rider: req.user.id, ride: rideId });
    if (existing) {
      return res.status(400).json({ message: `You already requested this ride (${existing.status})` });
    }

    const fallbackPickup = {
      type: 'Point',
      coordinates: ride.origin?.coordinates || []
    };
    const fallbackDropoff = {
      type: 'Point',
      coordinates: ride.destination?.coordinates || []
    };

    if (!fallbackPickup.coordinates.length || !fallbackDropoff.coordinates.length) {
      return res.status(400).json({ message: 'Ride route is incomplete and cannot be booked' });
    }

    const perSeatPrice = ride.pricePerSeat || Math.floor(ride.totalFuelCost / (ride.seatsTotal + 1));

    const booking = await Booking.create({
      rider: req.user.id,
      driver: ride.driver,
      ride: ride._id,
      dateTime: ride.departureTime,
      seatsBooked: requestedSeats,
      status: 'pending',
      tripPrice: perSeatPrice * requestedSeats,
      pickupLocation: pickupLocation || fallbackPickup,
      dropoffLocation: dropoffLocation || fallbackDropoff,
      notes: notes || ''
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status')
      .populate('driver', 'name email');

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Error creating booking request:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Hopper view own booking requests
// @route   GET /api/bookings/mine
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user.id })
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status')
      .populate('driver', 'name email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error getting hopper bookings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Sharer view booking requests for own rides
// @route   GET /api/bookings/driver
// @access  Private (driver)
const getDriverBookings = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Only sharers can view ride requests' });
    }

    const { status } = req.query;
    const query = { driver: req.user.id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('rider', 'name email')
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error getting driver bookings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Sharer accepts/rejects a booking request
// @route   PATCH /api/bookings/:id/respond
// @access  Private (driver)
const respondToBooking = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Only sharers can respond to requests' });
    }

    const { action } = req.body;
    if (!action || !['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'action must be accepted or rejected' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.driver.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    if (action === 'rejected') {
      booking.status = 'rejected';
      const rejected = await booking.save();
      return res.json(rejected);
    }

    // Accept flow: reserve seats only if enough capacity remains.
    const ride = await Ride.findOneAndUpdate(
      {
        _id: booking.ride,
        status: 'scheduled',
        $expr: {
          $lte: [{ $add: ['$seatsBooked', booking.seatsBooked] }, '$seatsTotal']
        }
      },
      {
        $inc: { seatsBooked: booking.seatsBooked }
      },
      {
        new: true
      }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Not enough seats available to accept this request' });
    }

    booking.status = 'accepted';
    await booking.save();

    const responsePayload = await Booking.findById(booking._id)
      .populate('rider', 'name email')
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status');

    res.json(responsePayload);
  } catch (error) {
    console.error('Error responding to booking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createBookingRequest,
  getMyBookings,
  getDriverBookings,
  respondToBooking
};
