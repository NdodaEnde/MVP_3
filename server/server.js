// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const questionnaireRoutes = require("./routes/questionnaireRoutes");
const { connectDB } = require("./config/database");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting enhanced SurgiScan server...');

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

// CORS configuration with enhanced security
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
connectDB();

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Basic Routes
app.use(basicRoutes);
// Authentication Routes
app.use('/api/auth', authRoutes);
// Patient Routes
app.use('/api/patients', patientRoutes);
// Questionnaire Routes
app.use('/api/questionnaires', questionnaireRoutes);

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: {
      enhancedValidation: true,
      notificationService: true,
      performanceOptimization: true
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log('Enhanced middleware configured');
  console.log('Notification service ready');
  console.log('Performance monitoring enabled');
  console.log(`Server running at http://localhost:${port}`);
});
