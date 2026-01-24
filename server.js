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
const brawlhallaRoutes = require('./routes/brawlhalla');

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

// proxy 
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']  
}));


app.use(express.json());

// Session configuration
app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,  
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/', 
  },
  proxy: true,
  name: 'connect.sid'  
}));

app.use(passport.initialize());
app.use(passport.session());

// Debug middleware
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log('🔑 Session ID:', req.sessionID);
  console.log('🍪 Cookies received:', req.headers.cookie);
  console.log('👤 User:', req.user ? req.user.steamId : 'Not authenticated');
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/brawlhalla', brawlhallaRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Brawlhalla Stats API is running',
    environment: process.env.NODE_ENV || 'development',
    authenticated: req.isAuthenticated(),
    sessionID: req.sessionID
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🗄️  Using PostgreSQL session store`);
});
