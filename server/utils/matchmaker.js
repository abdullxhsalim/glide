const decodePolyline = require('./polyline');

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const minDistanceToPath = (pointLat, pointLng, pathCoordinates) => {
    let minArgs = { dist: Infinity, index: -1 };
    for (let i = 0; i < pathCoordinates.length; i++) {
        const pLat = pathCoordinates[i][1];
        const pLng = pathCoordinates[i][0];
        const dist = getDistance(pointLat, pointLng, pLat, pLng);
        if (dist < minArgs.dist) {
            minArgs = { dist, index: i };
        }
    }
    return minArgs;
};

const parse12HourTime = (timeValue) => {
    let raw = String(timeValue || '').trim();
    if (!raw) return null;
    raw = raw.replace(/\s+/g, ' '); // Clean duplicate spaces
    const match = raw.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const modifier = match[3].toUpperCase();
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    return { hours, minutes, seconds: 0 };
};

module.exports = { getDistance, minDistanceToPath, parse12HourTime };
