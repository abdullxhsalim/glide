const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
app.use('/api/maps', require('./routes/mapRoutes'));


// Connect to MongoDB
// Use environment variable MONGODB_URI or default to local instance
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/glide';
console.log('Using MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
