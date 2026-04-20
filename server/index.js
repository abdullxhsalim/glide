const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ensureDefaultAdmin } = require('./utils/seedAdmin');

const app = express();
const PORT = process.env.PORT || 5001;
//change of port
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Glide API is running');
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/maps', require('./routes/mapRoutes'));

// Ensure unknown API paths return JSON instead of Express HTML pages.
app.use('/api', (req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Ensure API errors (including malformed JSON bodies) always return JSON.
app.use((err, req, res, next) => {
  if (!req.originalUrl.startsWith('/api')) {
    return next(err);
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || 'Server Error'
  });
});


// Connect to MongoDB
// Use environment variable MONGODB_URI or default to local instance
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/glide';
console.log('Using MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    await ensureDefaultAdmin();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
