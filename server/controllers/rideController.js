const Ride = require('../models/Ride');
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
      console.log(`  Ride ${idx}: origin.placeName=${ride.origin?.placeName}, origin.address=${ride.origin?.address}`);
    });

    let filteredRides = rides;

    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
       const pLat = parseFloat(pickupLat);
       const pLng = parseFloat(pickupLng);
       const dLat = parseFloat(dropoffLat);
       const dLng = parseFloat(dropoffLng);
       const MAX_DETOUR_KM = 3.5; 

       console.log(`Filtering rides for Pickup: ${pLat}, ${pLng} | Dropoff: ${dLat}, ${dLng}`);

       filteredRides = rides.filter(ride => {
           if (!ride.path || !ride.path.coordinates || ride.path.coordinates.length < 2) {
               console.log(`Ride ${ride._id} skipped: No path data`);
               return false;
           }

           const pickupMatch = minDistanceToPath(pLat, pLng, ride.path.coordinates);
           if (pickupMatch.dist > MAX_DETOUR_KM) {
               console.log(`Ride ${ride._id} skipped: Pickup too far (${pickupMatch.dist.toFixed(2)}km)`);
               return false;
           }

           const dropoffMatch = minDistanceToPath(dLat, dLng, ride.path.coordinates);
           if (dropoffMatch.dist > MAX_DETOUR_KM) {
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

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private
const createRide = async (req, res) => {
    try {
        const { origin, destination, departureTime, seatsTotal, totalFuelCost, vehicle, preferences, routeData } = req.body;

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
            preferences: preferences || {},
            vehicle: vehicle || req.user.vehicle // Use user's vehicle if not specified
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

module.exports = {
  getRides,
  createRide
};