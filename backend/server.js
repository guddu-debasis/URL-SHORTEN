const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const urlRoutes = require('./routes/url');
const authRoutes = require('./routes/auth');
const redirectRoute = require('./routes/redirect');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/', redirectRoute); // Short URL redirect (e.g. /aB3xK)

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => console.error('DB Connection Error:', err));
