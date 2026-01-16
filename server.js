require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const passport = require('./config/steam');
const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const notesRoutes = require('./routes/notes');
const trackingRoutes = require('./routes/tracking');

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection pool for sessions
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pgPool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// Trust proxy (important for Railway)
app.set('trust proxy', 1);

// CORS - must be before session
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session with PostgreSQL store
app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: true, // Always true since you're in production
    sameSite: 'none',
  },
  proxy: true,
  name: 'brawlstats.sid' // Custom session name
}));

app.use(passport.initialize());
app.use(passport.session());

// Debug middleware (remove in production later)
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log('🔑 Session ID:', req.sessionID);
  console.log('👤 User:', req.user ? req.user.steamId : 'Not authenticated');
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Brawlhalla Stats API is running',
    environment: process.env.NODE_ENV || 'development',
    authenticated: req.isAuthenticated()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🗄️  Using PostgreSQL session store`);
});