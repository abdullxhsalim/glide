const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const decodePolyline = require('../utils/polyline');
const { getDistance, minDistanceToPath, parse12HourTime } = require('../utils/matchmaker');

const autoMatchBooking = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, date, time, seatsBooked, type, pickupLocation, dropoffLocation } = req.body;
    
    // type = 'now' or 'schedule'
    const reqSeats = Number(seatsBooked) || 1;
    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    // Calculate time window
    let requestedDateTime;
    if (type === 'now') {
        requestedDateTime = new Date();
    } else {
        const [year, month, day] = date.split('-').map(Number);
        const parsedTime = parse12HourTime(time);
        requestedDateTime = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
    }
    
    // Look within ±60 minutes for scheduled, or inside next 30 min for 'now'
    let minTime, maxTime;
    if (type === 'now') {
        minTime = new Date(requestedDateTime.getTime() - 15 * 60000); // 15 min ago
        maxTime = new Date(requestedDateTime.getTime() + 60 * 60000); // next 1 hour
    } else {
        minTime = new Date(requestedDateTime.getTime() - 60 * 60000); // -60 min
        maxTime = new Date(requestedDateTime.getTime() + 60 * 60000); // +60 min
    }

    // 1. Fetch available scheduled rides in that time window
    const availableRides = await Ride.find({
        status: 'scheduled',
        driver: { $ne: req.user.id },
        departureTime: { $gte: minTime, $lte: maxTime }
    });

    let bestMatch = null;
    let fallbackPickup = null;
    let fallbackDropoff = null;
    let expectedPrice = null;

    // Configuration
    const PICKUP_THRESH_KM = 3.0;
    const DROPOFF_THRESH_KM = 3.0;

    for (const ride of availableRides) {
        // Calculate remaining seats
        const availableSeats = ride.seatsTotal - (ride.seatsBooked || 0);
        if (availableSeats < reqSeats) continue;

        // Path / Routing logic
        const pathCoords = ride.routePolyline ? decodePolyline(ride.routePolyline) : [];
        if (!pathCoords.length) {
            // fallback to origin/dest simple distance
            const oLat = ride.origin.coordinates[1];
            const oLng = ride.origin.coordinates[0];
            const dstLat = ride.destination.coordinates[1];
            const dstLng = ride.destination.coordinates[0];

            const pickDist = getDistance(pLat, pLng, oLat, oLng);
            const dropDist = getDistance(dLat, dLng, dstLat, dstLng);

            if (pickDist <= PICKUP_THRESH_KM && dropDist <= DROPOFF_THRESH_KM) {
                // Valid simple match
                // naive score
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
       return res.status(404).json({ message: "No drivers available along this route at the requested time." });
    }

    const matchedRide = bestMatch.ride;
    const perSeatPrice = matchedRide.pricePerSeat || Math.floor(matchedRide.totalFuelCost / (matchedRide.seatsTotal + 1));
    const tripPrice = perSeatPrice * reqSeats;

    fallbackPickup = {
        type: 'Point',
        coordinates: [pLng, pLat],
        placeName: pickupLocation || "Requested Pickup"
    };

    fallbackDropoff = {
        type: 'Point',
        coordinates: [dLng, dLat],
        placeName: dropoffLocation || "Requested Dropoff"
    };

    // Auto-create Booking
    const newBooking = await Booking.create({
        rider: req.user.id,
        driver: matchedRide.driver,
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
      .populate('driver', 'name email contactNumber');

    res.status(201).json({ 
        message: 'Ride Auto-Matched! Waiting for driver to accept.',
        booking: populatedBooking 
    });

  } catch (error) {
    console.error('Error auto-matching booking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { autoMatchBooking };
