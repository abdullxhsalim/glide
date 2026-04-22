const Ride = require('../models/Ride');
const PartnerRequest = require('../models/PartnerRequest');
const User = require('../models/User');
const decodePolyline = require('../utils/polyline');

// Helper: Calculate distance between two points (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const parse12HourTime = (timeValue) => {
    const raw = String(timeValue || '').trim();
    const match = raw.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);

    if (!match) {
        return null;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const modifier = match[3].toUpperCase();

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 1 ||
        hours > 12 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;

    return { hours, minutes, seconds: 0 };
};

// Helper: Find minimum distance from point to polyline (simplified as min distance to any vertex)
// Ideally this should project the point onto each segment, but vertex check is a fast approximation for dense polylines
const minDistanceToPath = (pointLat, pointLng, pathCoordinates) => {
    let minArgs = { dist: Infinity, index: -1 };

    for (let i = 0; i < pathCoordinates.length; i++) {
        // pathCoordinates are [lng, lat]
        const pLat = pathCoordinates[i][1];
        const pLng = pathCoordinates[i][0];
        const dist = getDistance(pointLat, pointLng, pLat, pLng);
        
        if (dist < minArgs.dist) {
            minArgs = { dist, index: i };
        }
    }
    return minArgs;
};


const getRides = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, date, time, minDepartureTime, maxDepartureTime } = req.query;

    let query = {
      status: 'scheduled',
    };

    if (minDepartureTime || maxDepartureTime) {
        query.departureTime = {};
        if (minDepartureTime) query.departureTime.$gte = new Date(minDepartureTime);
        if (maxDepartureTime) query.departureTime.$lte = new Date(maxDepartureTime);
    } else if (date) {
        let startOfRange = new Date(date);
        startOfRange.setHours(0, 0, 0, 0);

        if (time) {
            const [timePart, modifier] = time.split(' ');
            if (timePart && modifier) {
                let [hours, minutes] = timePart.split(':');
                hours = parseInt(hours, 10);
                minutes = parseInt(minutes, 10);

                if (hours === 12) {
                    hours = 0; // 12 AM is 0 hours
                }
                if (modifier === 'PM') {
                    hours += 12; // 1 PM is 13 hours, etc.
                }
                
                startOfRange.setHours(hours, minutes, 0, 0);
            }
        }
        
        // End of the day is always 23:59:59
        const endOfRange = new Date(date);
        endOfRange.setHours(23, 59, 59, 999);
        
        query.departureTime = {
            $gte: startOfRange,
            $lte: endOfRange
        };
    } else {
        // Default: Only show future rides
        query.departureTime = { $gte: new Date() };
    }
    
    const rides = await Ride.find(query)
      .populate('driver', 'name rating vehicle')
      .sort({ departureTime: 1 });

    console.log('DEBUG: Fetched rides from DB:');
    rides.forEach((ride, idx) => {
      console.log(`  Ride ${idx}: origin.placeName=${ride.origin?.placeName}, preferences=${JSON.stringify(ride.preferences)}`);
    });

    // Ensure all rides have complete preferences object with defaults for existing rides
    const defaultPreferences = {
        smoking: false,
        music: true,
        ac: true,
        quietPayload: false,
        pets: false,
        expressway: false,
        multipleStoppages: false
    };

    const ridesWithPreferences = rides.map(ride => {
        const rideObj = ride.toObject ? ride.toObject() : ride;
        rideObj.preferences = { ...defaultPreferences, ...(ride.preferences || {}) };
        return rideObj;
    });

    let filteredRides = ridesWithPreferences;

    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
       const pLat = parseFloat(pickupLat);
       const pLng = parseFloat(pickupLng);
       const dLat = parseFloat(dropoffLat);
       const dLng = parseFloat(dropoffLng);
       const MAX_PICKUP_DETOUR_KM = 1.0; 
       const MAX_DROPOFF_DETOUR_KM = 3.5; 

       console.log(`Filtering rides for Pickup: ${pLat}, ${pLng} | Dropoff: ${dLat}, ${dLng}`);

       filteredRides = ridesWithPreferences.filter(ride => {
           if (!ride.path || !ride.path.coordinates || ride.path.coordinates.length < 2) {
               console.log(`Ride ${ride._id} skipped: No path data`);
               return false;
           }

           const pickupMatch = minDistanceToPath(pLat, pLng, ride.path.coordinates);
           if (pickupMatch.dist > MAX_PICKUP_DETOUR_KM) {
               console.log(`Ride ${ride._id} skipped: Pickup too far (${pickupMatch.dist.toFixed(2)}km)`);
               return false;
           }

           const dropoffMatch = minDistanceToPath(dLat, dLng, ride.path.coordinates);
           if (dropoffMatch.dist > MAX_DROPOFF_DETOUR_KM) {
               console.log(`Ride ${ride._id} skipped: Dropoff too far (${dropoffMatch.dist.toFixed(2)}km)`);
               return false;
           }

           if (pickupMatch.index >= dropoffMatch.index) {
                console.log(`Ride ${ride._id} skipped: Wrong direction (Pickup Idx: ${pickupMatch.index}, Dropoff Idx: ${dropoffMatch.index})`);
                return false;
           }

           return true; 
       });
    }

    res.json(filteredRides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Find ride partners around same route/time
// @route   GET /api/rides/find-partners
// @access  Private
const findPartners = async (req, res) => {
    try {
        const {
            pickupLat,
            pickupLng,
            dropoffLat,
            dropoffLng,
            date,
            time,
            locationThresholdKm,
            timeWindowMin
        } = req.query;

        if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng || !date || !time) {
            return res.status(400).json({
                message: 'Pickup, destination, date and time are required to find partners'
            });
        }

        const pLat = parseFloat(pickupLat);
        const pLng = parseFloat(pickupLng);
        const dLat = parseFloat(dropoffLat);
        const dLng = parseFloat(dropoffLng);

        if ([pLat, pLng, dLat, dLng].some((n) => Number.isNaN(n))) {
            return res.status(400).json({ message: 'Invalid pickup/dropoff coordinates' });
        }

        const parsedTime = parse12HourTime(time);
        if (!parsedTime) {
            return res.status(400).json({ message: 'Time must be in format hh:mm AM/PM' });
        }

        const [year, month, day] = date.split('-').map(Number);
        const requestedDateTime = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);
        if (Number.isNaN(requestedDateTime.getTime())) {
            return res.status(400).json({ message: 'Invalid date value' });
        }

        const windowMinutes = Math.max(15, parseInt(timeWindowMin || '90', 10));
        const pickupThresholdKm = 1.0;
        const dropoffThresholdKm = 3.5;

        const minTime = new Date(requestedDateTime.getTime() - windowMinutes * 60 * 1000);
        const maxTime = new Date(requestedDateTime.getTime() + windowMinutes * 60 * 1000);

        const requests = await PartnerRequest.find({
            status: 'pending',
            requestedAt: { $gte: minTime, $lte: maxTime },
            requester: { $ne: req.user.id }
        })
            .populate('requester', 'name email contactNumber phone')
            .sort({ requestedAt: 1 });

        const partnerMatches = requests
            .map((request) => {
                const pickupCoords = request.pickup?.coordinates || [];
                const destinationCoords = request.destination?.coordinates || [];

                if (pickupCoords.length !== 2 || destinationCoords.length !== 2) {
                    return null;
                }

                const pickupDistance = getDistance(pLat, pLng, pickupCoords[1], pickupCoords[0]);
                const dropoffDistance = getDistance(dLat, dLng, destinationCoords[1], destinationCoords[0]);
                const isNearby = pickupDistance <= pickupThresholdKm && dropoffDistance <= dropoffThresholdKm;

                if (!isNearby) {
                    return null;
                }

                return {
                    requestId: request._id,
                    partnerName: request.requester?.name || 'Unknown',
                    contactNumber:
                        request.requester?.contactNumber || request.requester?.phone || request.requester?.email || 'Not provided',
                    pickupLocation: request.pickup?.placeName || request.pickup?.address || 'Unknown',
                    destinationLocation: request.destination?.placeName || request.destination?.address || 'Unknown',
                    pickupCoordinates: {
                        lat: request.pickup?.coordinates?.[1],
                        lng: request.pickup?.coordinates?.[0]
                    },
                    destinationCoordinates: {
                        lat: request.destination?.coordinates?.[1],
                        lng: request.destination?.coordinates?.[0]
                    },
                    departureTime: request.requestedAt,
                    pickupDistanceKm: Number(pickupDistance.toFixed(2)),
                    dropoffDistanceKm: Number(dropoffDistance.toFixed(2))
                };
            })
            .filter(Boolean);

        res.json(partnerMatches);
    } catch (error) {
        console.error('Error finding partners:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Save partner request information
// @route   POST /api/rides/partner-requests
// @access  Private
const createPartnerRequest = async (req, res) => {
    try {
        const { pickup, destination, date, time } = req.body;

        if (!pickup || !destination || !date || !time) {
            return res.status(400).json({ message: 'Pickup, destination, date and time are required' });
        }

        const pickupLat = Number(pickup.lat);
        const pickupLng = Number(pickup.lng);
        const destinationLat = Number(destination.lat);
        const destinationLng = Number(destination.lng);

        if (
            !Number.isFinite(pickupLat) ||
            !Number.isFinite(pickupLng) ||
            !Number.isFinite(destinationLat) ||
            !Number.isFinite(destinationLng)
        ) {
            return res.status(400).json({ message: 'Invalid pickup/destination coordinates' });
        }

        const normalizeCoord = (value) => Number(Number(value).toFixed(6));
        const normalizedPickupLat = normalizeCoord(pickupLat);
        const normalizedPickupLng = normalizeCoord(pickupLng);
        const normalizedDestinationLat = normalizeCoord(destinationLat);
        const normalizedDestinationLng = normalizeCoord(destinationLng);

        const parsedTime = parse12HourTime(time);
        if (!parsedTime) {
            return res.status(400).json({ message: 'Time must be in format hh:mm AM/PM' });
        }

        const [year, month, day] = String(date).split('-').map(Number);
        const requestedAt = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);

        if (Number.isNaN(requestedAt.getTime())) {
            return res.status(400).json({ message: 'Invalid date value' });
        }

        const existingRequest = await PartnerRequest.findOne({
            requester: req.user.id,
            status: 'pending',
            requestedAt,
            requestedTimeLabel: String(time),
            'pickup.coordinates': [normalizedPickupLng, normalizedPickupLat],
            'destination.coordinates': [normalizedDestinationLng, normalizedDestinationLat]
        });

        if (existingRequest) {
            return res.status(200).json({
                message: 'Same request already exists. Reusing your existing request.',
                requestId: existingRequest._id,
                duplicate: true
            });
        }

        const savedRequest = await PartnerRequest.create({
            requester: req.user.id,
            pickup: {
                type: 'Point',
                coordinates: [normalizedPickupLng, normalizedPickupLat],
                placeName: pickup.name || pickup.address || '',
                address: pickup.address || pickup.name || ''
            },
            destination: {
                type: 'Point',
                coordinates: [normalizedDestinationLng, normalizedDestinationLat],
                placeName: destination.name || destination.address || '',
                address: destination.address || destination.name || ''
            },
            requestedAt,
            requestedTimeLabel: String(time)
        });

        res.status(201).json({
            message: 'Partner request saved successfully',
            requestId: savedRequest._id
        });
    } catch (error) {
        console.error('Error saving partner request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get logged-in user's ongoing partner requests
// @route   GET /api/rides/partner-requests/mine
// @access  Private
const getMyPartnerRequests = async (req, res) => {
    try {
        const requests = await PartnerRequest.find({
            requester: req.user.id,
            status: 'pending'
        }).sort({ requestedAt: -1 });

        const formatted = requests.map((request) => ({
            requestId: request._id,
            pickupLocation: request.pickup?.placeName || request.pickup?.address || 'Unknown',
            destinationLocation: request.destination?.placeName || request.destination?.address || 'Unknown',
            pickupAddress: request.pickup?.address || '',
            destinationAddress: request.destination?.address || '',
            pickupCoordinates: {
                lat: request.pickup?.coordinates?.[1],
                lng: request.pickup?.coordinates?.[0]
            },
            destinationCoordinates: {
                lat: request.destination?.coordinates?.[1],
                lng: request.destination?.coordinates?.[0]
            },
            departureTime: request.requestedAt,
            timeLabel: request.requestedTimeLabel,
            status: request.status
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching my partner requests:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update logged-in user's partner request
// @route   PUT /api/rides/partner-requests/:id
// @access  Private
const updateMyPartnerRequest = async (req, res) => {
    try {
        const request = await PartnerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Partner request not found' });
        }

        if (request.requester.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this request' });
        }

        const { pickupLocation, destinationLocation, date, time } = req.body;

        if (pickupLocation !== undefined) {
            request.pickup.placeName = String(pickupLocation).trim();
            request.pickup.address = String(pickupLocation).trim();
        }

        if (destinationLocation !== undefined) {
            request.destination.placeName = String(destinationLocation).trim();
            request.destination.address = String(destinationLocation).trim();
        }

        if (date !== undefined || time !== undefined) {
            const nextDate = date || request.requestedAt.toISOString().slice(0, 10);
            const nextTime = time || request.requestedTimeLabel;

            const parsedTime = parse12HourTime(nextTime);
            if (!parsedTime) {
                return res.status(400).json({ message: 'Time must be in format hh:mm AM/PM' });
            }

            const [year, month, day] = String(nextDate).split('-').map(Number);
            const requestedAt = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);

            if (Number.isNaN(requestedAt.getTime())) {
                return res.status(400).json({ message: 'Invalid date value' });
            }

            request.requestedAt = requestedAt;
            request.requestedTimeLabel = String(nextTime);
        }

        await request.save();

        res.json({
            requestId: request._id,
            pickupLocation: request.pickup?.placeName || request.pickup?.address || 'Unknown',
            destinationLocation: request.destination?.placeName || request.destination?.address || 'Unknown',
            pickupAddress: request.pickup?.address || '',
            destinationAddress: request.destination?.address || '',
            pickupCoordinates: {
                lat: request.pickup?.coordinates?.[1],
                lng: request.pickup?.coordinates?.[0]
            },
            destinationCoordinates: {
                lat: request.destination?.coordinates?.[1],
                lng: request.destination?.coordinates?.[0]
            },
            departureTime: request.requestedAt,
            timeLabel: request.requestedTimeLabel,
            status: request.status
        });
    } catch (error) {
        console.error('Error updating partner request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete logged-in user's partner request
// @route   DELETE /api/rides/partner-requests/:id
// @access  Private
const deleteMyPartnerRequest = async (req, res) => {
    try {
        const request = await PartnerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Partner request not found' });
        }

        if (request.requester.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this request' });
        }

        request.status = 'rejected'; /* Soft delete */ await request.save();
        res.json({ message: 'Partner request deleted successfully' });
    } catch (error) {
        console.error('Error deleting partner request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private
const createRide = async (req, res) => {
    try {
        const { origin, destination, departureTime, seatsTotal, totalFuelCost, vehicle, preferences, routeData } = req.body;

        const driver = await User.findById(req.user.id).select('role isVerified vehicleVerificationStatus vehicle');
        if (!driver || driver.role !== 'driver') {
            return res.status(403).json({ message: 'Only verified sharers can create rides' });
        }

        const verificationApproved =
            driver.vehicleVerificationStatus === 'approved' ||
            (driver.vehicleVerificationStatus == null && driver.isVerified === true);

        if (!verificationApproved) {
            return res.status(403).json({
                message: 'Your vehicle verification is not approved yet. Please wait for admin approval before creating rides.'
            });
        }

        console.log('DEBUG: Creating ride with:');
        console.log('  Origin placeName:', origin?.placeName);
        console.log('  Origin address:', origin?.address);
        console.log('  Destination placeName:', destination?.placeName);
        console.log('  Destination address:', destination?.address);

        if (!origin || !destination || !departureTime || !seatsTotal || !totalFuelCost) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        let routePath = { type: 'LineString', coordinates: [] };
        if (routeData && routeData.geometry) {
            try {
                routePath.coordinates = decodePolyline(routeData.geometry);
            } catch (err) {
                console.warn('Failed to decode polyline:', err);
            }
        }

        // Merge incoming preferences with defaults to ensure all fields are present
        const defaultPreferences = {
            smoking: false,
            music: true,
            ac: true,
            quietPayload: false,
            pets: false,
            expressway: false,
            multipleStoppages: false
        };
        const mergedPreferences = { ...defaultPreferences, ...(preferences || {}) };

        const ride = await Ride.create({
            driver: req.user.id, // Assumes auth middleware adds user to req
            origin,
            destination,
            departureTime,
            seatsTotal,
            totalFuelCost,
            routeData: routeData || {},
            path: routePath.coordinates.length > 0 ? routePath : undefined, // Save GeoJSON path for spatial queries
            // Calculate a baseline price for sorting/display purposes (e.g. if car is full)
            pricePerSeat: Math.floor(totalFuelCost / (parseInt(seatsTotal) + 1)), 
            preferences: mergedPreferences,
            vehicle: vehicle || driver.vehicle // Use user's vehicle if not specified
        });

        console.log('DEBUG: Ride created:', {
          originPlaceName: ride.origin?.placeName,
          originAddress: ride.origin?.address,
          destPlaceName: ride.destination?.placeName,
          destAddress: ride.destination?.address
        });

        res.status(201).json(ride);
    } catch (error) {
        console.error('Error creating ride:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Get rides created by logged-in driver
// @route   GET /api/rides/mine
// @access  Private
const getMyRides = async (req, res) => {
    try {
        const rides = await Ride.find({ driver: req.user.id }).sort({ createdAt: -1 });
        res.json(rides);
    } catch (error) {
        console.error('Error fetching driver rides:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a ride created by logged-in driver
// @route   PUT /api/rides/:id
// @access  Private
const updateMyRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this ride' });
        }

        const allowedFields = ['departureTime', 'seatsTotal', 'totalFuelCost', 'preferences', 'status'];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                if (field === 'preferences') {
                    ride.preferences = { ...(ride.preferences || {}), ...req.body.preferences };
                } else {
                    ride[field] = req.body[field];
                }
            }
        });

        if (ride.seatsTotal < ride.seatsBooked) {
            return res.status(400).json({ message: 'Seats total cannot be less than already booked seats' });
        }

        if (ride.seatsTotal > 0 && ride.totalFuelCost > 0) {
            ride.pricePerSeat = Math.floor(ride.totalFuelCost / (parseInt(ride.seatsTotal, 10) + 1));
        }

        const updatedRide = await ride.save();
        res.json(updatedRide);
    } catch (error) {
        console.error('Error updating ride:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a ride created by logged-in driver
// @route   DELETE /api/rides/:id
// @access  Private
const deleteMyRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this ride' });
        }

        ride.status = 'cancelled'; /* Soft delete */ await ride.save();
        res.json({ message: 'Ride deleted successfully' });
    } catch (error) {
        console.error('Error deleting ride:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
  getRides,
    findPartners,
        createPartnerRequest,
        getMyPartnerRequests,
                updateMyPartnerRequest,
                deleteMyPartnerRequest,
    createRide,
    getMyRides,
    updateMyRide,
    deleteMyRide
};