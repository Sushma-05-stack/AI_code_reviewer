const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── LangSmith tracing bootstrap ──────────────────────────────────────────────
if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_TRACING === 'true') {
  process.env.LANGCHAIN_TRACING_V2 = 'true';
  process.env.LANGCHAIN_ENDPOINT = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
  process.env.LANGCHAIN_API_KEY = process.env.LANGSMITH_API_KEY;
  process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT || 'genai';
}

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/review');
const reportRoutes = require('./routes/reports');

const app = express();

// Trust proxy (needed for rate limiting behind proxies / Render)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS — allow localhost + any Vercel deployment
app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      origin === 'http://localhost:3000' ||
      origin === (process.env.CLIENT_URL || '') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(null, true); // open in production — tighten after go-live
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    langsmith: process.env.LANGSMITH_TRACING === 'true' ? 'enabled' : 'disabled',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection + server start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    if (process.env.LANGSMITH_TRACING === 'true') {
      console.log(`✅ LangSmith tracing — project: ${process.env.LANGCHAIN_PROJECT}`);
    }
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
