const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');

// Routes import
const awsCredentialsRoutes = require('./routes/awsCredentialsRoutes');
const authRoutes = require('./routes/authRoutes');
const subdomainRoutes = require('./routes/subdomainRoutes');
const serverDetectionRoutes = require('./routes/serverDetectionRoutes');

// Load env variables
dotenv.config();

const app = express();

// Set up CORS with more permissive configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001'],
  credentials: true
}));

// Enable body parsing
app.use(express.json());

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'certpilot-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 3600000 } // 1 hour
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/aws-credentials', awsCredentialsRoutes);
app.use('/api/subdomains', subdomainRoutes);
app.use('/api/server-detection', serverDetectionRoutes);

// Home route for testing
app.get('/', (req, res) => {
  res.send('CertPilot API is running');
});

// Add error handling middleware AFTER routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 