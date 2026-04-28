const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const decodePolyline = require('../utils/polyline');
const { getDistance, minDistanceToPath, parse12HourTime } = require('../utils/matchmaker');

// @desc    Auto-match a hopper's location and time with an ongoing ride and immediately book it
// @route   POST /api/bookings/auto-match
// @access  Private (rider)
const autoMatchBooking = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, date, time, seatsBooked, type, pickupAddress, dropoffAddress } = req.body;
    
    // type = 'now' or 'schedule'
    const reqSeats = Number(seatsBooked) || 1;
    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) {
        return res.status(400).json({ message: "Invalid pickup/dropoff coordinates." });
    }

    // Calculate time window
    let requestedDateTime;
    if (type === 'now') {
        requestedDateTime = new Date();
    } else {
        const [year, month, day] = String(date).split('-').map(Number);
        const parsedTime = parse12HourTime(time);
        if (!parsedTime || isNaN(year)) return res.status(400).json({ message: "Invalid date or time formatted." });
        requestedDateTime = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
    }
    
    // Look within ±90 minutes for scheduled, or inside next 90 min for 'now'
    let minTime, maxTime;
    if (type === 'now') {
        minTime = new Date(requestedDateTime.getTime() - 30 * 60000); // 30 min ago
        maxTime = new Date(requestedDateTime.getTime() + 90 * 60000); // next 1.5 hours
    } else {
        minTime = new Date(requestedDateTime.getTime() - 90 * 60000); // -90 min
        maxTime = new Date(requestedDateTime.getTime() + 90 * 60000); // +90 min
    }

    // 1. Fetch available scheduled rides in that time window
    const availableRides = await Ride.find({
        status: 'scheduled',
        driver: { $ne: req.user.id },
        departureTime: { $gte: minTime, $lte: maxTime }
    }).populate('driver', 'name vehicleModel vehiclePlate contactNumber rating');

    let bestMatch = null;

    // Configuration
    const PICKUP_THRESH_KM = 3.5;
    const DROPOFF_THRESH_KM = 3.5;

    for (const ride of availableRides) {
        // Calculate remaining seats
        const availableSeats = ride.seatsTotal - (ride.seatsBooked || 0);
        if (availableSeats < reqSeats) continue;

        // Path / Routing logic
        const pathCoords = ride.routePolyline ? decodePolyline(ride.routePolyline) : [];
        if (!pathCoords.length) {
            // fallback to origin/dest simple distance
            const oLng = ride.origin.coordinates[0];
            const oLat = ride.origin.coordinates[1];
            const dstLng = ride.destination.coordinates[0];
            const dstLat = ride.destination.coordinates[1];

            const pickDist = getDistance(pLat, pLng, oLat, oLng);
            const dropDist = getDistance(dLat, dLng, dstLat, dstLng);

            if (pickDist <= PICKUP_THRESH_KM && dropDist <= DROPOFF_THRESH_KM) {
                const matchScore = pickDist + dropDist;
                if (!bestMatch || matchScore < bestMatch.score) {
                    bestMatch = { ride, score: matchScore, pickDist, dropDist };
                }
            }
            continue;
        }

        // Full path matching
        const pickInfo = minDistanceToPath(pLat, pLng, pathCoords);
        const dropInfo = minDistanceToPath(dLat, dLng, pathCoords);

        if (pickInfo.dist <= PICKUP_THRESH_KM && dropInfo.dist <= DROPOFF_THRESH_KM && pickInfo.index <= dropInfo.index) {
            const matchScore = pickInfo.dist + dropInfo.dist;
            if (!bestMatch || matchScore < bestMatch.score) {
                bestMatch = { ride, score: matchScore, pickDist: pickInfo.dist, dropDist: dropInfo.dist };
            }
        }
    }

    if (!bestMatch) {
       return res.status(404).json({ message: "No drivers available along this route at the requested time. Check back later!" });
    }

    const matchedRide = bestMatch.ride;
    const perSeatPrice = matchedRide.pricePerSeat || Math.floor(matchedRide.totalFuelCost / (matchedRide.seatsTotal + 1)) || 50;
    const tripPrice = perSeatPrice * reqSeats;

    const fallbackPickup = {
        type: 'Point',
        coordinates: [pLng, pLat],
        address: pickupAddress || "Requested Pickup"
    };

    const fallbackDropoff = {
        type: 'Point',
        coordinates: [dLng, dLat],
        address: dropoffAddress || "Requested Dropoff"
    };

    // Auto-create Booking
    const newBooking = await Booking.create({
        rider: req.user.id,
        driver: matchedRide.driver._id,
        ride: matchedRide._id,
        dateTime: matchedRide.departureTime,
        seatsBooked: reqSeats,
        status: 'pending',
        tripPrice: tripPrice,
        pickupLocation: fallbackPickup,
        dropoffLocation: fallbackDropoff
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status')
      .populate('driver', 'name email contactNumber vehicleModel vehiclePlate');

    res.status(201).json({ 
        message: 'Ride Auto-Matched! Waiting for driver to accept.',
        booking: populatedBooking 
    });

  } catch (error) {
    console.error('Error auto-matching booking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Hopper creates a booking request for a ride (Legacy/Manual)
// @route   POST /api/bookings
const createBookingRequest = async (req, res) => {
  try {
    if (!['rider', 'driver'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only riders or drivers can request a ride' });
    }
    const { rideId, seatsBooked = 1, pickupLocation, dropoffLocation, notes } = req.body;
    if (!rideId) return res.status(400).json({ message: 'rideId is required' });

    const requestedSeats = Number(seatsBooked);
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
      return res.status(400).json({ message: 'seatsBooked must be a positive integer' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'scheduled') return res.status(400).json({ message: 'Only scheduled rides can be booked' });
    if (ride.driver.toString() === req.user.id.toString()) return res.status(400).json({ message: 'Driver cannot book own ride' });

    const availableSeats = ride.seatsTotal - (ride.seatsBooked || 0);
    if (requestedSeats > availableSeats) return res.status(400).json({ message: `Only ${availableSeats} seats available` });

    const existing = await Booking.findOne({ rider: req.user.id, ride: rideId });
    if (existing) return res.status(400).json({ message: `You already requested this ride (${existing.status})` });

    const fallbackPickup = {
      type: 'Point',
      coordinates: ride.origin?.coordinates || [],
      placeName: ride.origin?.placeName,
      address: ride.origin?.address
    };
    const fallbackDropoff = {
      type: 'Point',
      coordinates: ride.destination?.coordinates || [],
      placeName: ride.destination?.placeName,
      address: ride.destination?.address
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

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user.id })
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status')
      .populate('driver', 'name vehicleModel vehiclePlate contactNumber phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const getDriverBookings = async (req, res) => {
  try {
    if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only sharers can view ride requests' });
    const { status } = req.query;
    const query = { driver: req.user.id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('rider', 'name email contactNumber phone')
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const respondToBooking = async (req, res) => {
  try {
    if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only sharers can respond' });
    const { action } = req.body;
    if (!action || !['accepted', 'rejected'].includes(action)) return res.status(400).json({ message: 'action must be accepted or rejected' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.driver.toString() !== req.user.id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'pending') return res.status(400).json({ message: `Booking is already ${booking.status}` });

    if (action === 'rejected') {
      booking.status = 'rejected';
      const rejected = await booking.save();
      return res.json(rejected);
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: booking.ride,
        status: 'scheduled',
        $expr: { $lte: [{ $add: ['$seatsBooked', booking.seatsBooked] }, '$seatsTotal'] }
      },
      { $inc: { seatsBooked: booking.seatsBooked } },
      { new: true }
    );

    if (!ride) return res.status(400).json({ message: 'Not enough seats available' });

    booking.status = 'accepted';
    await booking.save();
    const responsePayload = await Booking.findById(booking._id)
      .populate('rider', 'name email')
      .populate('ride', 'origin destination departureTime seatsTotal seatsBooked status');
    res.json(responsePayload);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

module.exports = { autoMatchBooking, createBookingRequest, getMyBookings, getDriverBookings, respondToBooking };
