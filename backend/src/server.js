const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

// Import database connection
const { query } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const userRoutes = require('./routes/user/userRoutes');

// Import authentication middleware
const { authenticate, enforceTenancy } = require('./middlewares/authMiddleware');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://catatjasamu.com',
  'https://www.catatjasamu.com',
  'https://api.catatjasamu.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For public endpoints, allow any origin
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - More relaxed for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute (very generous for dev)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Only apply to routes that need it in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// Security headers to prevent caching of sensitive data
app.use((req, res, next) => {
  // Prevent caching of API responses for authenticated routes
  if (req.path.startsWith('/api/user') || req.path.startsWith('/api/admin')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
  }
  next();
});

// ====================================
// PASSPORT CONFIGURATION
// ====================================

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'catat-jasamu-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth profile:', profile);

    const googleId = profile.id;
    const email = profile.emails[0].value;
    
    // Build full name from Google profile
    let fullName = profile.displayName;
    if (profile.name) {
      const givenName = profile.name.givenName;
      const familyName = profile.name.familyName;
      if (givenName && familyName) {
        fullName = `${givenName} ${familyName}`;
      } else if (givenName) {
        fullName = givenName;
      } else if (familyName) {
        fullName = familyName;
      }
    }
    
    const profilePictureUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    // Check if user already exists with this Google ID
    let userResult = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    if (userResult.rows.length > 0) {
      // User exists with Google ID, update profile picture if changed
      const existingUser = userResult.rows[0];
      await query(
        `UPDATE users SET 
          avatar_url = $1,
          google_email = $2,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3`,
        [profilePictureUrl, email, existingUser.id]
      );
      
      // Fetch updated user
      const updatedUser = await query('SELECT * FROM users WHERE id = $1', [existingUser.id]);
      return done(null, updatedUser.rows[0]);
    }

    // Check if user exists with same email
    userResult = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length > 0) {
      // Link Google account to existing user
      const existingUser = userResult.rows[0];
      await query(
        `UPDATE users SET 
          google_id = $1, 
          avatar_url = $2, 
          google_email = $3,
          auth_provider = $4,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $5`,
        [googleId, profilePictureUrl, email, 'google', existingUser.id]
      );

      // Fetch updated user
      const updatedUser = await query(
        'SELECT * FROM users WHERE id = $1',
        [existingUser.id]
      );

      return done(null, updatedUser.rows[0]);
    }

    // Create new user
    const username = email.split('@')[0].toLowerCase();
    const insertResult = await query(
      `INSERT INTO users (
        username, full_name, email, google_id, google_email, avatar_url, auth_provider,
        role, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      RETURNING *`,
      [username, fullName, email, googleId, email, profilePictureUrl, 'google', 'user']
    );

    return done(null, insertResult.rows[0]);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

// ====================================
// FAVICON ROUTE
// ====================================
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content - browser won't show error
});

// GOOGLE OAUTH ROUTES
// ====================================

// Check if email exists (for Google OAuth validation)
// Used by frontend to determine if user should login or register
app.get('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await query(
      'SELECT id, email, auth_provider FROM users WHERE email = $1 OR google_email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return res.json({
        success: true,
        exists: true,
        auth_provider: user.auth_provider,
        message: 'User exists'
      });
    }

    return res.json({
      success: true,
      exists: false,
      message: 'User not found'
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email'
    });
  }
});

// Google OAuth login route - for existing users
app.get('/api/auth/google/login',
  (req, res, next) => {
    // Store action type in session
    req.session.googleAction = 'login';
    next();
  },
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  })
);

// Google OAuth register route - for new users
app.get('/api/auth/google/register',
  (req, res, next) => {
    // Store action type in session
    req.session.googleAction = 'register';
    next();
  },
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  })
);

// Keep original route for backward compatibility
app.get('/api/auth/google',
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  })
);

// Google OAuth callback route
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      console.log('OAuth callback successful, user:', req.user);
      
      const googleAction = req.session.googleAction || 'login';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Check if this is a new user (created just now) or existing
      const isNewUser = req.user.created_at && 
        (new Date() - new Date(req.user.created_at)) < 10000; // Created within last 10 seconds
      
      console.log('Google Action:', googleAction, 'Is New User:', isNewUser);
      
      // Validation: If trying to login but user is new (doesn't exist), redirect to register
      if (googleAction === 'login' && isNewUser) {
        // Delete the just-created user since they should register first
        await query('DELETE FROM users WHERE id = $1', [req.user.id]);
        console.log('User tried to login but account does not exist, deleted temp user');
        return res.redirect(`${frontendUrl}/register?error=not_registered&email=${encodeURIComponent(req.user.email)}&message=Akun%20belum%20terdaftar.%20Silakan%20daftar%20terlebih%20dahulu.`);
      }
      
      // Validation: If trying to register but user already existed, redirect to login
      if (googleAction === 'register' && !isNewUser) {
        console.log('User tried to register but account already exists');
        return res.redirect(`${frontendUrl}/login?error=already_registered&email=${encodeURIComponent(req.user.email)}&message=Akun%20sudah%20terdaftar.%20Silakan%20login.`);
      }

      // Clear the action from session
      delete req.session.googleAction;

      // Generate JWT token for the authenticated user
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          provider: 'google'
        },
        process.env.JWT_SECRET || 'catat-jasamu-jwt-secret-2025',
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token and provider info
      const redirectUrl = `${frontendUrl}/login?token=${token}&provider=google&success=true&openCalendar=true`;

      console.log('Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Catat Jasamu API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Docker health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await query('SELECT 1');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'down'
      },
      error: error.message
    });
  }
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Catat Jasamu API',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      bookings: '/api/bookings',
      clients: '/api/clients',
      services: '/api/services',
    }
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount admin routes
app.use('/api/admin', adminRoutes);

// Mount user routes
app.use('/api/user', userRoutes);

// Real endpoints with database
app.get('/api/user/dashboard/stats', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user
    const { month, year } = req.query;
    
    // Build date filter for month/year if provided
    let dateFilter = '';
    const params = [userId];
    let paramIndex = 2;
    
    if (month && year) {
      dateFilter = ` AND EXTRACT(MONTH FROM b.booking_date) = $${paramIndex}::int AND EXTRACT(YEAR FROM b.booking_date) = $${paramIndex + 1}::int`;
      params.push(parseInt(month), parseInt(year));
    }
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_booking,
        COUNT(*) FILTER (WHERE b.status = 'confirmed') as scheduled,
        COUNT(*) FILTER (WHERE b.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled
      FROM bookings b
      WHERE b.user_id = $1 ${dateFilter}
    `;
    
    const paymentQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'unpaid') as unpaid,
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'partial') as down_payment,
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'paid') as paid
      FROM bookings b
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.user_id = $1 ${dateFilter}
    `;
    
    const stats = await query(statsQuery, params);
    const payments = await query(paymentQuery, params);
    
    res.json({
      success: true,
      data: {
        totalBooking: parseInt(stats.rows[0].total_booking),
        scheduled: parseInt(stats.rows[0].scheduled),
        completed: parseInt(stats.rows[0].completed),
        cancelled: parseInt(stats.rows[0].cancelled),
        unpaid: parseInt(payments.rows[0].unpaid),
        downPayment: parseInt(payments.rows[0].down_payment),
        paid: parseInt(payments.rows[0].paid)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

app.get('/api/user/bookings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // Get filter parameters
    const statusFilter = req.query.status; // 'confirmed', 'completed', 'cancelled'
    const paymentFilter = req.query.payment_status; // 'unpaid', 'partial', 'paid'
    
    // Build WHERE conditions dynamically
    let whereConditions = ['b.user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;
    
    if (statusFilter) {
      whereConditions.push(`b.status = $${paramIndex}`);
      queryParams.push(statusFilter);
      paramIndex++;
    }
    
    if (paymentFilter) {
      whereConditions.push(`COALESCE(p.payment_status, 'unpaid') = $${paramIndex}`);
      queryParams.push(paymentFilter);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const bookingsQuery = `
      SELECT 
        b.id,
        b.service_id,
        b.booking_name,
        c.name as client_name,
        c.phone as contact,
        s.name as service_name,
        to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(b.booking_time, 'HH24:MI:SS') as booking_time,
        b.location_name,
        b.location_map_url,
        b.status,
        b.total_price as total_amount,
        b.notes,
        COALESCE(p.payment_status, 'unpaid') as payment_status,
        COALESCE(p.amount, 0) as amount_paid
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE ${whereClause}
    `;
    
    // Add LIMIT and OFFSET params
    queryParams.push(pageSize, offset);
    
    const bookings = await query(bookingsQuery, queryParams);
    
    // Parse booking details from notes if JSON format
    const parsedBookings = bookings.rows.map(booking => {
      let bookingDetails = null;
      let booking_date_end = null;
      let booking_time_end = null;
      let booking_days = 1;
      let services = [];
      let responsible_parties = [];
      
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          const notesObj = JSON.parse(booking.notes);
          bookingDetails = notesObj;
          
          // Extract booking end date and time
          if (notesObj.booking_date_end) {
            booking_date_end = notesObj.booking_date_end;
          }
          if (notesObj.booking_time_end) {
            booking_time_end = notesObj.booking_time_end;
          }
          if (notesObj.booking_days) {
            booking_days = notesObj.booking_days;
          }
          
          // Extract services array
          if (notesObj.services && Array.isArray(notesObj.services)) {
            services = notesObj.services;
          }
          
          // Extract responsible parties
          if (notesObj.responsible_parties && Array.isArray(notesObj.responsible_parties)) {
            responsible_parties = notesObj.responsible_parties;
          }
        }
      } catch (parseError) {
        console.log('Notes is not JSON format for booking', booking.id);
      }
      
      return {
        ...booking,
        booking_date_end,
        booking_time_end,
        booking_days,
        services: services.length > 0 ? services : [booking.service_name],
        responsible_parties,
        booking_details: bookingDetails
      };
    });
    
    // For count query, use same params but without LIMIT/OFFSET
    const countParams = queryParams.slice(0, -2);
    const count = await query(countQuery, countParams);
    
    const total = parseInt(count.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);
    
    res.json({
      success: true,
      data: {
        bookings: parsedBookings.map(booking => ({
          id: booking.id,
          service_id: booking.service_id,
          booking_name: booking.booking_name,
          client_name: booking.client_name,
          contact: booking.contact,
          services: Array.isArray(booking.services) ? booking.services : [booking.service_name],
          booking_date: booking.booking_date,
          booking_date_end: booking.booking_date_end,
          booking_time: booking.booking_time,
          booking_time_end: booking.booking_time_end,
          booking_days: booking.booking_days,
          location_name: booking.location_name,
          location_map_url: booking.location_map_url,
          status: booking.status,
          payment_status: booking.payment_status,
          total_price: parseFloat(booking.total_amount || booking.total_price),
          amount_paid: parseFloat(booking.amount_paid),
          responsible_parties: booking.responsible_parties,
          notes: booking.notes,
          booking_details: booking.booking_details
        })),
        total,
        totalPages,
        currentPage: page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

app.get('/api/user/services', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const servicesQuery = `
      SELECT id, name, price as default_price, description, category, duration
      FROM services
      WHERE user_id = $1 AND is_active = true
      ORDER BY name
    `;
    
    const services = await query(servicesQuery, [userId]);
    
    res.json({
      success: true,
      data: services.rows.map(service => ({
        id: service.id,
        name: service.name,
        default_price: parseFloat(service.default_price),
        description: service.description,
        category: service.category,
        duration: service.duration
      }))
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

// POST: Create new service
app.post('/api/user/services', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, description, default_price } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'User ID and service name are required'
      });
    }

    const insertQuery = `
      INSERT INTO services (user_id, name, description, price, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, price as default_price, description
    `;

    const result = await query(insertQuery, [
      user_id,
      name,
      description || null,
      default_price || 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        default_price: parseFloat(result.rows[0].default_price),
        description: result.rows[0].description
      }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
});

// PUT: Update service
app.put('/api/user/services/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    const { name, description, default_price } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }

    const updateQuery = `
      UPDATE services 
      SET name = $1, description = $2, price = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, price as default_price, description
    `;

    const result = await query(updateQuery, [
      name,
      description || null,
      default_price || 0,
      serviceId,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        default_price: parseFloat(result.rows[0].default_price),
        description: result.rows[0].description
      }
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// DELETE: Delete service
app.delete('/api/user/services/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM services 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [serviceId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
});

app.get('/api/user/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const clientsQuery = `
      SELECT id, name, phone, email, address, company
      FROM clients
      WHERE user_id = $1
      ORDER BY name
    `;
    
    const clients = await query(clientsQuery, [userId]);
    
    res.json({
      success: true,
      data: clients.rows
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
});

// POST: Create new client
app.post('/api/user/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and phone are required'
      });
    }

    const insertQuery = `
      INSERT INTO clients (user_id, name, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, phone, address
    `;

    const result = await query(insertQuery, [user_id, name, phone, address || null]);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client'
    });
  }
});

// PUT: Update client
app.put('/api/user/clients/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const clientId = req.params.id;
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const updateQuery = `
      UPDATE clients 
      SET name = $1, phone = $2, address = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, phone, address
    `;

    const result = await query(updateQuery, [name, phone, address || null, clientId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client'
    });
  }
});

// DELETE: Delete client
app.delete('/api/user/clients/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const clientId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM clients 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [clientId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client'
    });
  }
});

// Responsible Parties endpoints
app.get('/api/user/responsible-parties', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const partiesQuery = `
      SELECT id, name, phone, address
      FROM responsible_parties
      WHERE user_id = $1
      ORDER BY name
    `;
    
    const parties = await query(partiesQuery, [userId]);
    
    res.json({
      success: true,
      data: parties.rows
    });
  } catch (error) {
    console.error('Error fetching responsible parties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch responsible parties'
    });
  }
});

// Service Responsible Parties endpoints
app.get('/api/user/service-responsible-parties', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const queryText = `
      SELECT 
        srp.id,
        rp.name,
        rp.phone,
        rp.address,
        srp.service_id,
        s.name as service_name
      FROM service_responsible_parties srp
      JOIN responsible_parties rp ON srp.responsible_party_id = rp.id
      JOIN services s ON srp.service_id = s.id
      WHERE rp.user_id = $1
      ORDER BY rp.name
    `;
    const result = await query(queryText, [userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching service responsible parties:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service responsible parties' });
  }
});

// POST: Create new responsible party
app.post('/api/user/responsible-parties', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const insertQuery = `
      INSERT INTO responsible_parties (user_id, name, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, phone, address
    `;

    const result = await query(insertQuery, [user_id, name, phone, address || null]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Responsible party created successfully'
    });
  } catch (error) {
    console.error('Error creating responsible party:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create responsible party'
    });
  }
});

// PUT: Update responsible party
app.put('/api/user/responsible-parties/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const partyId = req.params.id;
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const updateQuery = `
      UPDATE responsible_parties
      SET name = $1, phone = $2, address = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, phone, address
    `;

    const result = await query(updateQuery, [name, phone, address || null, partyId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Responsible party not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Responsible party updated successfully'
    });
  } catch (error) {
    console.error('Error updating responsible party:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update responsible party'
    });
  }
});

// DELETE: Delete responsible party
app.delete('/api/user/responsible-parties/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const partyId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM responsible_parties
      WHERE id = $1 AND user_id = $2
    `;

    const result = await query(deleteQuery, [partyId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Responsible party not found'
      });
    }

    res.json({
      success: true,
      message: 'Responsible party deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting responsible party:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete responsible party'
    });
  }
});

// PUT: Update booking
app.put('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  const client = await require('./config/database').getClient();
  
  try {
    await client.query('BEGIN');
    
    const bookingId = req.params.id;
    const userId = req.user.id;
    const {
      booking_name,
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status,
      payment_status: requestPaymentStatus,
      total_amount,
      amount_paid,
      notes
    } = req.body;

    console.log('=== UPDATE BOOKING ===');
    console.log('Booking ID:', bookingId);
    console.log('Booking Name:', booking_name);
    console.log('Service ID:', service_id, 'Type:', typeof service_id);
    console.log('Booking Date:', booking_date);
    console.log('Booking Time:', booking_time);
    console.log('Location Name:', location_name);
    console.log('Location Map URL:', location_map_url);
    console.log('Status:', status);
    console.log('Total Amount:', total_amount);
    console.log('Amount Paid:', amount_paid);
    console.log('Payment Status:', requestPaymentStatus);
    console.log('Notes length:', notes ? notes.length : 0);
    console.log('====================');

    // Validate required fields
    if (!booking_date) {
      throw new Error('booking_date is required');
    }
    if (!status) {
      throw new Error('status is required');
    }

    // Build dynamic update query based on whether service_id is provided
    let updateBookingQuery;
    let updateParams;
    
    if (service_id) {
      // Update with service_id
      updateBookingQuery = `
        UPDATE bookings 
        SET booking_name = $1,
            service_id = $2, 
            booking_date = $3, 
            booking_time = $4, 
            location_name = $5,
            location_map_url = $6,
            status = $7, 
            total_price = $8, 
            notes = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10 AND user_id = $11
        RETURNING id
      `;
      updateParams = [
        booking_name || null,
        service_id,
        booking_date,
        booking_time,
        location_name,
        location_map_url,
        status,
        total_amount,
        notes || null,
        bookingId,
        userId
      ];
    } else {
      // Update without service_id (keep existing service_id)
      updateBookingQuery = `
        UPDATE bookings 
        SET booking_name = $1,
            booking_date = $2, 
            booking_time = $3, 
            location_name = $4,
            location_map_url = $5,
            status = $6, 
            total_price = $7, 
            notes = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND user_id = $10
        RETURNING id
      `;
      updateParams = [
        booking_name || null,
        booking_date,
        booking_time,
        location_name,
        location_map_url,
        status,
        total_amount,
        notes || null,
        bookingId,
        userId
      ];
    }
    
    const updateResult = await client.query(updateBookingQuery, updateParams);

    if (updateResult.rows.length === 0) {
      throw new Error('Booking not found');
    }

    // Determine payment_status: use request payment_status if provided, otherwise calculate
    let payment_status = requestPaymentStatus;
    if (!payment_status) {
      payment_status = amount_paid >= total_amount ? 'paid' : amount_paid > 0 ? 'partial' : 'unpaid';
    }

    // Auto-adjust amount_paid based on payment_status if needed
    let finalAmountPaid = amount_paid;
    if (payment_status === 'paid' && amount_paid < total_amount) {
      // If status is 'paid' but amount_paid is less than total, set it to total
      finalAmountPaid = total_amount;
    } else if (payment_status === 'unpaid') {
      // If status is 'unpaid', set amount_paid to 0
      finalAmountPaid = 0;
    }

    // Update or create payment
    const checkPaymentQuery = `SELECT id FROM payments WHERE booking_id = $1`;
    const paymentCheck = await client.query(checkPaymentQuery, [bookingId]);

    if (paymentCheck.rows.length > 0) {
      // Update existing payment
      const updatePaymentQuery = `
        UPDATE payments 
        SET amount = $1, 
            payment_status = $2::VARCHAR,
            payment_date = CASE WHEN $2::VARCHAR != 'unpaid' THEN CURRENT_TIMESTAMP ELSE payment_date END
        WHERE booking_id = $3
      `;
      await client.query(updatePaymentQuery, [finalAmountPaid, payment_status, bookingId]);
    } else {
      // Create new payment if doesn't exist
      const createPaymentQuery = `
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date)
        VALUES ($1, $2, $3, $4::VARCHAR, CASE WHEN $4::VARCHAR != 'unpaid' THEN CURRENT_TIMESTAMP ELSE NULL END)
      `;
      await client.query(createPaymentQuery, [bookingId, finalAmountPaid, 'cash', payment_status]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking berhasil diupdate'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('=== ERROR UPDATING BOOKING ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('============================');
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengupdate booking',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// DELETE: Delete booking
app.delete('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    
    // Delete booking (cascade will delete payments)
    const deleteQuery = `
      DELETE FROM bookings 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await query(deleteQuery, [bookingId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Booking berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus booking'
    });
  }
});

// PATCH: Update Google Calendar event ID for booking
app.patch('/api/user/bookings/:id/google-event', authenticate, enforceTenancy, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { google_calendar_event_id } = req.body;

    // Verify booking belongs to user
    const checkQuery = 'SELECT id FROM bookings WHERE id = $1 AND user_id = $2';
    const checkResult = await query(checkQuery, [bookingId, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Update google_calendar_event_id
    const updateQuery = `
      UPDATE bookings 
      SET google_calendar_event_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING id, google_calendar_event_id
    `;
    
    const result = await query(updateQuery, [google_calendar_event_id, bookingId, userId]);

    res.json({
      success: true,
      message: 'Google Calendar event ID updated',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating Google Calendar event ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate Google Calendar event ID'
    });
  }
});

// GET: Get single booking detail
app.get('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    
    const bookingQuery = `
      SELECT 
        b.id,
        b.user_id,
        b.client_id,
        c.name as client_name,
        c.phone as contact,
        c.address,
        b.service_id,
        s.name as service_name,
        b.booking_name,
        to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(b.booking_time, 'HH24:MI') as booking_time,
        b.location_name,
        b.location_map_url,
        b.status,
        b.total_price as total_amount,
        b.notes,
        b.google_calendar_event_id,
        COALESCE(p.payment_status, 'unpaid') as payment_status,
        COALESCE(p.amount, 0) as amount_paid
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.id = $1 AND b.user_id = $2
    `;
    
    const result = await query(bookingQuery, [bookingId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    const booking = result.rows[0];
    
    // Parse booking details from notes if JSON format
    let bookingDetails = null;
    try {
      if (booking.notes && booking.notes.trim().startsWith('{')) {
        bookingDetails = JSON.parse(booking.notes);
      }
    } catch (parseError) {
      console.log('Notes is not JSON format for booking', booking.id);
    }

    res.json({
      success: true,
      data: {
        ...booking,
        booking_details: bookingDetails
      }
    });

  } catch (error) {
    console.error('Error fetching booking detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat detail booking'
    });
  }
});

// POST: Create new booking
app.post('/api/user/bookings', authenticate, enforceTenancy, async (req, res) => {
  const client = await require('./config/database').getClient();
  
  try {
    await client.query('BEGIN');
    
    const user_id = req.user.id;
    
    // SECURITY: Validate and sanitize all inputs
    const { validateBookingData } = require('./utils/validation');
    let validatedData;
    
    try {
      validatedData = validateBookingData(req.body);
    } catch (validationError) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }
    
    const {
      booking_name,
      client_id,
      client_name,
      contact,
      address,
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status,
      total_amount,
      amount_paid,
      notes
    } = validatedData;

    let finalClientId = client_id;

    // SECURITY: Validate client_id belongs to current user
    if (client_id) {
      const validateClientQuery = `
        SELECT id FROM clients 
        WHERE id = $1 AND user_id = $2
      `;
      const clientCheck = await client.query(validateClientQuery, [client_id, user_id]);
      
      if (clientCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Invalid client ID or client does not belong to you'
        });
      }
      
      finalClientId = client_id;
    }

    // If new client, create client first
    if (!client_id && client_name) {
      const createClientQuery = `
        INSERT INTO clients (user_id, name, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const clientResult = await client.query(createClientQuery, [user_id, client_name, contact, address]);
      finalClientId = clientResult.rows[0].id;
    }

    // Create booking
    const createBookingQuery = `
      INSERT INTO bookings (user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, status, total_price, booking_name, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const bookingResult = await client.query(createBookingQuery, [
      user_id,
      finalClientId,
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status,
      total_amount,
      booking_name || null,
      notes
    ]);

    const bookingId = bookingResult.rows[0].id;

    // Create payment record if amount_paid > 0
    if (amount_paid > 0) {
      const payment_status = amount_paid >= total_amount ? 'paid' : 'partial';
      const createPaymentQuery = `
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      await client.query(createPaymentQuery, [bookingId, amount_paid, 'cash', payment_status]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: { booking_id: bookingId }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat booking'
    });
  } finally {
    client.release();
  }
});

// Company Settings Endpoints
app.get('/api/user/company-settings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    const settingsQuery = `
      SELECT *
      FROM company_settings
      WHERE user_id = $1
    `;

    const result = await query(settingsQuery, [userId]);

    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings'
    });
  }
});

app.post('/api/user/company-settings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt,
      account_number_alt,
      account_holder_name_alt
    } = req.body;

    const insertQuery = `
      INSERT INTO company_settings (
        user_id, company_name, company_address, company_phone, company_email,
        company_logo_url, bank_name, account_number, account_holder_name,
        payment_instructions, bank_name_alt, account_number_alt, account_holder_name_alt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      user_id,
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url || null,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt || null,
      account_number_alt || null,
      account_holder_name_alt || null
    ]);

    res.json({
      success: true,
      message: 'Company settings saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save company settings'
    });
  }
});

app.put('/api/user/company-settings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt,
      account_number_alt,
      account_holder_name_alt
    } = req.body;

    const updateQuery = `
      UPDATE company_settings
      SET company_name = $2,
          company_address = $3,
          company_phone = $4,
          company_email = $5,
          company_logo_url = $6,
          bank_name = $7,
          account_number = $8,
          account_holder_name = $9,
          payment_instructions = $10,
          bank_name_alt = $11,
          account_number_alt = $12,
          account_holder_name_alt = $13,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await query(updateQuery, [
      user_id,
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt,
      account_number_alt,
      account_holder_name_alt
    ]);

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings'
    });
  }
});

// ====================================
// USER PROFILE ENDPOINTS
// ====================================

// Get user profile
app.get('/api/user/profile', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await query(
      'SELECT id, email as username, full_name as name, email, role, auth_provider, booking_code, created_at FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// GET: Get booking link info
app.get('/api/user/booking-link', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        u.booking_code,
        u.full_name,
        cs.company_name,
        cs.company_logo_url,
        cs.company_address,
        cs.company_phone
      FROM users u
      LEFT JOIN company_settings cs ON u.id = cs.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const data = result.rows[0];
    
    // Use frontend URL for booking link (port 3000 for frontend, not 5001 backend)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.json({
      success: true,
      data: {
        booking_code: data.booking_code,
        booking_url: `/booking/${data.booking_code}`,
        full_url: `${frontendUrl}/booking/${data.booking_code}`,
        company_name: data.company_name || data.full_name,
        logo: data.company_logo_url,
        address: data.company_address,
        phone: data.company_phone
      }
    });
  } catch (error) {
    console.error('Error fetching booking link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking link'
    });
  }
});

// POST: Regenerate booking code (if user wants new link)
app.post('/api/user/booking-link/regenerate', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate new unique code
    const result = await query(
      `UPDATE users 
       SET booking_code = (
         SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyz0123456789', ceil(random()*36)::integer, 1), '')
         FROM generate_series(1, 16)
       )
       WHERE id = $1
       RETURNING booking_code`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newCode = result.rows[0].booking_code;
    
    // Use frontend URL for booking link (port 3000 for frontend, not 5001 backend)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.json({
      success: true,
      message: 'Booking link berhasil diperbarui',
      data: {
        booking_code: newCode,
        booking_url: `/booking/${newCode}`,
        full_url: `${frontendUrl}/booking/${newCode}`
      }
    });
  } catch (error) {
    console.error('Error regenerating booking link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate booking link'
    });
  }
});

// Update user profile (name & email)
app.put('/api/user/profile', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, email } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Get current user to check auth provider
    const userResult = await query(
      'SELECT auth_provider, email as current_email FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = userResult.rows[0];
    const isGoogleOAuth = currentUser.auth_provider === 'google';

    // Jika Google OAuth, gunakan email saat ini (tidak bisa diubah)
    const finalEmail = isGoogleOAuth ? currentUser.current_email : email;

    // Validate email hanya jika bukan Google OAuth
    if (!isGoogleOAuth) {
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if email is already used by another user
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, user_id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    // Update profile - email hanya diupdate jika bukan Google OAuth
    const result = await query(
      `UPDATE users 
       SET full_name = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, username, full_name as name, email, role, auth_provider, created_at`,
      [name, finalEmail, user_id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
app.put('/api/user/change-password', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { currentPassword, newPassword, verificationPin } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user's current password hash and PIN
    const userResult = await query(
      'SELECT password, security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const bcrypt = require('bcryptjs');

    // If user has PIN, require PIN verification
    if (user.security_pin) {
      if (!verificationPin) {
        return res.status(400).json({
          success: false,
          message: 'PIN verifikasi diperlukan untuk mengubah password'
        });
      }

      if (verificationPin.length !== 6 || !/^\d{6}$/.test(verificationPin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN harus 6 digit angka'
        });
      }

      // Verify PIN
      const isPinValid = await bcrypt.compare(verificationPin, user.security_pin);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'PIN verifikasi salah'
        });
      }
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user_id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// ====================================
// SECURITY PIN ENDPOINTS
// ====================================

// Get PIN status (check if user has set PIN)
app.get('/api/user/pin-status', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        hasPin: result.rows[0].security_pin !== null && result.rows[0].security_pin !== ''
      }
    });
  } catch (error) {
    console.error('Error checking PIN status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check PIN status'
    });
  }
});

// Set or update security PIN
app.post('/api/user/set-pin', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pin, currentPassword, currentPin } = req.body;

    // Validate PIN
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    // Get user's current password hash and security PIN
    const userResult = await query(
      'SELECT password, security_pin, auth_provider FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const bcrypt = require('bcryptjs');

    // Check if user is Google OAuth user
    const isGoogleUser = user.auth_provider === 'google';

    // Verify current password for security (skip for Google OAuth users)
    if (!isGoogleUser && !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini diperlukan untuk keamanan'
      });
    }

    // If user already has PIN, require current PIN verification
    if (user.security_pin) {
      if (!currentPin) {
        return res.status(400).json({
          success: false,
          message: 'PIN saat ini diperlukan untuk verifikasi'
        });
      }

      if (currentPin.length !== 6 || !/^\d{6}$/.test(currentPin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN saat ini harus 6 digit angka'
        });
      }

      // Verify current PIN
      const isCurrentPinValid = await bcrypt.compare(currentPin, user.security_pin);
      if (!isCurrentPinValid) {
        return res.status(401).json({
          success: false,
          message: 'PIN saat ini salah'
        });
      }
    }

    // Verify password (skip for Google OAuth users)
    if (!isGoogleUser) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password saat ini salah'
        });
      }
    }

    // Hash PIN for security
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update PIN
    await query(
      'UPDATE users SET security_pin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPin, user_id]
    );

    res.json({
      success: true,
      message: 'PIN keamanan berhasil diatur'
    });
  } catch (error) {
    console.error('Error setting PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengatur PIN'
    });
  }
});

// Verify security PIN
app.post('/api/user/verify-pin', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pin } = req.body;

    // Validate PIN format
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    // Get user's PIN hash
    const result = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!result.rows[0].security_pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN belum diatur'
      });
    }

    // Verify PIN
    const bcrypt = require('bcryptjs');
    const isPinValid = await bcrypt.compare(pin, result.rows[0].security_pin);

    if (!isPinValid) {
      return res.status(400).json({
        success: false,
        message: 'PIN salah'
      });
    }

    res.json({
      success: true,
      message: 'PIN benar'
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi PIN'
    });
  }
});

// Reset password with PIN (Lupa Password)
app.post('/api/user/reset-password-with-pin', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pin, newPassword } = req.body;

    // Validate inputs
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Get user's PIN hash
    const result = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (!result.rows[0].security_pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN belum diatur. Tidak dapat mereset password dengan PIN.'
      });
    }

    // Verify PIN
    const bcrypt = require('bcryptjs');
    const isPinValid = await bcrypt.compare(pin, result.rows[0].security_pin);

    if (!isPinValid) {
      return res.status(400).json({
        success: false,
        message: 'PIN salah'
      });
    }

    // PIN valid, hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user_id]
    );

    res.json({
      success: true,
      message: 'Password berhasil direset'
    });
  } catch (error) {
    console.error('Error resetting password with PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mereset password'
    });
  }
});

// ====================================
// EXPENSES (PENGELUARAN) ENDPOINTS
// ====================================

// Get all expenses with filters
app.get('/api/user/expenses', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { month, year, category } = req.query;
    
    let queryText = `
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = $1
    `;
    
    const params = [user_id];
    let paramCount = 1;
    
    if (month) {
      paramCount++;
      queryText += ` AND EXTRACT(MONTH FROM e.expense_date) = $${paramCount}`;
      params.push(month);
    }
    
    if (year) {
      paramCount++;
      queryText += ` AND EXTRACT(YEAR FROM e.expense_date) = $${paramCount}`;
      params.push(year);
    }
    
    if (category) {
      paramCount++;
      queryText += ` AND e.category_id = $${paramCount}`;
      params.push(category);
    }
    
    queryText += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
});

// Get expense by ID
app.get('/api/user/expenses/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = $1 AND e.user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense'
    });
  }
});

// Create new expense
app.post('/api/user/expenses', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      category_id,
      amount,
      description,
      expense_date,
      notes
    } = req.body;
    
    const result = await query(
      `INSERT INTO expenses (
        user_id,
        category_id,
        amount,
        description,
        expense_date,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [user_id, category_id, amount, description, expense_date, notes]
    );
    
    res.json({
      success: true,
      message: 'Expense created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  }
});

// Update expense
app.put('/api/user/expenses/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      category_id,
      amount,
      description,
      expense_date,
      notes
    } = req.body;
    
    const result = await query(
      `UPDATE expenses 
      SET 
        category_id = $1,
        amount = $2,
        description = $3,
        expense_date = $4,
        notes = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING *`,
      [category_id, amount, description, expense_date, notes, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
});

// Delete expense
app.delete('/api/user/expenses/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
});

// Get expense categories
app.get('/api/user/expense-categories', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT * FROM expense_categories 
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY is_default DESC, name ASC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories'
    });
  }
});

// Create expense category
app.post('/api/user/expense-categories', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color, icon } = req.body;
    
    const result = await query(
      `INSERT INTO expense_categories (user_id, name, color, icon, is_default)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *`,
      [userId, name, color || '#6B7280', icon || '💰']
    );
    
    res.json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense category'
    });
  }
});

// Update expense category
app.put('/api/user/expense-categories/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, color, icon } = req.body;
    
    const result = await query(
      `UPDATE expense_categories 
      SET name = $1, color = $2, icon = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND is_default = false AND user_id = $5
      RETURNING *`,
      [name, color, icon, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be edited (default category)'
      });
    }
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense category'
    });
  }
});

// Delete expense category
app.delete('/api/user/expense-categories/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if category has expenses
    const checkResult = await query(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing expenses'
      });
    }
    
    const result = await query(
      'DELETE FROM expense_categories WHERE id = $1 AND is_default = false AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be deleted (default category)'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense category'
    });
  }
});

// Get financial summary
app.get('/api/user/financial-summary', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    
    // Filter untuk booking_date (revenue, unpaid)
    let dateFilter = '';
    const params = [userId];
    let paramCount = 1;
    
    // Filter untuk payment_date (paid)
    let paymentDateFilter = '';
    const paymentParams = [userId];
    
    if (month && year) {
      paramCount++;
      dateFilter = ` AND EXTRACT(MONTH FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(month));
      paramCount++;
      dateFilter += ` AND EXTRACT(YEAR FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(year));
      
      // Filter pembayaran berdasarkan payment_date
      paymentDateFilter = ' AND EXTRACT(MONTH FROM p.payment_date) = $2::int AND EXTRACT(YEAR FROM p.payment_date) = $3::int';
      paymentParams.push(parseInt(month), parseInt(year));
    }
    
    // Get revenue and unpaid from bookings (filter by booking_date)
    // Logika:
    // 1. Status 'cancelled' + unpaid (amount_paid = 0) → TIDAK dihitung sama sekali
    // 2. Status 'cancelled' + partial/paid (amount_paid > 0) → amount_paid masuk ke total_paid, sisa tidak dihitung
    // 3. Status lainnya → dihitung normal
    const revenueResult = await query(
      `SELECT 
        -- Total Revenue: hanya dari booking yang BUKAN (cancelled + unpaid)
        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0 THEN 0
              ELSE CAST(b.total_price AS DECIMAL)
            END
          ), 0
        ) as total_revenue,
        
        -- Total Unpaid: sisa yang belum dibayar, KECUALI dari booking cancelled
        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'cancelled' THEN 0
              ELSE CAST(b.total_price AS DECIMAL) - CAST(COALESCE(p.amount_paid, 0) AS DECIMAL)
            END
          ), 0
        ) as total_unpaid
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, SUM(amount) as amount_paid
        FROM payments
        GROUP BY booking_id
      ) p ON b.id = p.booking_id
      WHERE b.user_id = $1 ${dateFilter}`,
      params
    );
    
    // Get total_paid from payments (filter by payment_date, not booking_date)
    const paidResult = await query(
      `SELECT COALESCE(SUM(CAST(p.amount AS DECIMAL)), 0) as total_paid
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      WHERE b.user_id = $1 ${paymentDateFilter}`,
      paymentParams
    );
    
    // Get expenses data
    let expenseParams = [userId];
    let expenseDateFilter = '';
    
    if (month && year) {
      expenseDateFilter = ' AND EXTRACT(MONTH FROM expense_date) = $2::int AND EXTRACT(YEAR FROM expense_date) = $3::int';
      expenseParams = [userId, parseInt(month), parseInt(year)];
    }
    
    const expenseResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE user_id = $1 ${expenseDateFilter}`,
      expenseParams
    );

    // Get tax data from paid bookings (exclude cancelled bookings)
    const taxResult = await query(
      `SELECT b.id, b.total_price, b.notes
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, 
               SUM(amount) as amount_paid,
               MAX(payment_status) as payment_status
        FROM payments
        GROUP BY booking_id
      ) p ON b.id = p.booking_id
      WHERE b.user_id = $1 ${dateFilter} AND COALESCE(p.payment_status, 'unpaid') = 'paid' AND b.status != 'cancelled'`,
      params
    );

    console.log('Tax query result count:', taxResult.rows.length);
    console.log('Tax query params:', params);

    let totalTax = 0;
    console.log('Calculating total tax for user:', userId, 'with date filter:', dateFilter);
    for (const booking of taxResult.rows) {
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          const bookingDetails = JSON.parse(booking.notes);
          console.log('Booking:', booking.id || 'unknown', 'total_price:', booking.total_price, 'tax_percentage:', bookingDetails.tax_percentage);
          
          // Try to calculate from booking details if available
          if (bookingDetails.services && bookingDetails.tax_percentage) {
            console.log('Calculating tax from booking details...');
            
            // Calculate subtotal from services
            let subtotal = 0;
            if (Array.isArray(bookingDetails.services)) {
              subtotal = bookingDetails.services.reduce((sum, service) => {
                return sum + (parseFloat(service.custom_price || 0) * parseInt(service.quantity || 1));
              }, 0);
            }
            
            // Multiply by booking days
            const bookingDays = parseInt(bookingDetails.booking_days) || 1;
            subtotal = subtotal * bookingDays;
            
            // Apply discount
            if (bookingDetails.discount) {
              if (bookingDetails.discount_type === 'persen') {
                subtotal = subtotal * (1 - parseFloat(bookingDetails.discount) / 100);
              } else {
                subtotal = Math.max(0, subtotal - parseFloat(bookingDetails.discount));
              }
            }
            
            // Calculate tax
            const taxPercentage = parseFloat(bookingDetails.tax_percentage) || 0;
            const taxAmount = subtotal * (taxPercentage / 100);
            
            totalTax += taxAmount;
            console.log('Calculated tax_amount:', taxAmount, 'from subtotal:', subtotal, 'booking_days:', bookingDays, 'tax_percentage:', taxPercentage);
          } else {
            console.log('Skipping booking - insufficient tax calculation data');
          }
        } else {
          console.log('Booking notes is not JSON or empty for booking total_price:', booking.total_price);
        }
      } catch (error) {
        // Skip if notes is not valid JSON
        console.log('Error parsing booking notes for tax calculation:', error.message, 'for booking total_price:', booking.total_price);
      }
    }
    console.log('Final totalTax:', totalTax);
    
    // Get tax from cancelled bookings that are paid (add to net income)
    const cancelledTaxResult = await query(
      `SELECT b.id, b.total_price, b.notes
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, 
               SUM(amount) as amount_paid,
               MAX(payment_status) as payment_status
        FROM payments
        GROUP BY booking_id
      ) p ON b.id = p.booking_id
      WHERE b.user_id = $1 ${dateFilter} AND COALESCE(p.payment_status, 'unpaid') = 'paid' AND b.status = 'cancelled'`,
      params
    );

    let cancelledTax = 0;
    console.log('Calculating cancelled tax for user:', userId, 'with date filter:', dateFilter);
    for (const booking of cancelledTaxResult.rows) {
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          const bookingDetails = JSON.parse(booking.notes);
          console.log('Cancelled Booking:', booking.id || 'unknown', 'total_price:', booking.total_price, 'tax_percentage:', bookingDetails.tax_percentage);
          
          // Try to calculate from booking details if available
          if (bookingDetails.services && bookingDetails.tax_percentage) {
            console.log('Calculating cancelled tax from booking details...');
            
            // Calculate subtotal from services
            let subtotal = 0;
            if (Array.isArray(bookingDetails.services)) {
              subtotal = bookingDetails.services.reduce((sum, service) => {
                return sum + (parseFloat(service.custom_price || 0) * parseInt(service.quantity || 1));
              }, 0);
            }
            
            // Multiply by booking days
            const bookingDays = parseInt(bookingDetails.booking_days) || 1;
            subtotal = subtotal * bookingDays;
            
            // Apply discount
            if (bookingDetails.discount) {
              if (bookingDetails.discount_type === 'persen') {
                subtotal = subtotal * (1 - parseFloat(bookingDetails.discount) / 100);
              } else {
                subtotal = Math.max(0, subtotal - parseFloat(bookingDetails.discount));
              }
            }
            
            // Calculate tax
            const taxPercentage = parseFloat(bookingDetails.tax_percentage) || 0;
            const taxAmount = subtotal * (taxPercentage / 100);
            
            cancelledTax += taxAmount;
            console.log('Calculated cancelled tax_amount:', taxAmount, 'from subtotal:', subtotal, 'booking_days:', bookingDays, 'tax_percentage:', taxPercentage);
          } else {
            console.log('Skipping cancelled booking - insufficient tax calculation data');
          }
        } else {
          console.log('Cancelled booking notes is not JSON or empty for booking total_price:', booking.total_price);
        }
      } catch (error) {
        // Skip if notes is not valid JSON
        console.log('Error parsing cancelled booking notes for tax calculation:', error.message, 'for booking total_price:', booking.total_price);
      }
    }
    console.log('Final cancelledTax:', cancelledTax);
    
    const revenue = revenueResult.rows[0];
    const paid = paidResult.rows[0];
    const expenses = expenseResult.rows[0];
    
    res.json({
      success: true,
      data: {
        total_revenue: parseFloat(revenue.total_revenue),
        total_paid: parseFloat(paid.total_paid),
        total_unpaid: parseFloat(revenue.total_unpaid),
        total_expenses: parseFloat(expenses.total_expenses),
        total_tax: parseFloat(totalTax.toFixed(2)),
        net_income: parseFloat(paid.total_paid) - parseFloat(expenses.total_expenses) - parseFloat(totalTax.toFixed(2)) + parseFloat(cancelledTax.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get financial details for specific card
app.get('/api/user/financial-details/:type', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const { month, year } = req.query;
    
    console.log('Financial details request:', { type, month, year, userId });
    
    // Filter berdasarkan booking_date (untuk revenue, unpaid, tax)
    let dateFilter = '';
    // Filter berdasarkan payment_date (untuk paid)
    let paymentDateFilter = '';
    const params = [userId];
    let paramCount = 1;
    
    if (month && year) {
      paramCount++;
      dateFilter = ` AND EXTRACT(MONTH FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(month));
      paramCount++;
      dateFilter += ` AND EXTRACT(YEAR FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(year));
      
      // Untuk paid, gunakan payment_date bukan booking_date
      paymentDateFilter = ` AND EXTRACT(MONTH FROM p.payment_date) = $2::int AND EXTRACT(YEAR FROM p.payment_date) = $3::int`;
    }
    
    let queryStr = '';
    let total = 0;
    let data = [];
    
    switch (type) {
      case 'revenue':
        // Total revenue from all bookings (except cancelled + unpaid)
        queryStr = `
          SELECT 
            b.id,
            c.name as client_name,
            b.total_price as amount,
            b.booking_date,
            b.status,
            COALESCE(p.amount_paid, 0) as amount_paid,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND NOT (b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0)
          ORDER BY b.booking_date DESC
        `;
        
        const revenueResult = await query(queryStr, params);
        
        data = revenueResult.rows.map(row => {
          let serviceNames = 'Layanan';
          try {
            if (row.services_json && row.services_json !== '[]' && row.services_json !== 'null') {
              const services = JSON.parse(row.services_json);
              if (Array.isArray(services) && services.length > 0) {
                serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
              }
            }
          } catch (e) {
            console.log('Error parsing services JSON for revenue:', e.message, 'Data:', row.services_json);
            serviceNames = 'Layanan';
          }
          
          return {
            client_name: row.client_name || 'Client',
            service_names: serviceNames,
            amount: parseFloat(row.amount),
            booking_date: row.booking_date,
            status: row.status
          };
        });
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'paid':
        // Amount already paid - filter berdasarkan payment_date bukan booking_date
        queryStr = `
          SELECT 
            b.id,
            c.name as client_name,
            p.amount as amount,
            p.payment_date,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM payments p
          INNER JOIN bookings b ON p.booking_id = b.id
          LEFT JOIN clients c ON b.client_id = c.id
          WHERE b.user_id = $1 ${paymentDateFilter}
          ORDER BY p.payment_date DESC
        `;
        
        const paidResult = await query(queryStr, params);
        
        data = paidResult.rows.map(row => {
          let serviceNames = 'Layanan';
          try {
            if (row.services_json && row.services_json !== '[]') {
              const services = JSON.parse(row.services_json);
              if (Array.isArray(services) && services.length > 0) {
                serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
              }
            }
          } catch (e) {
            serviceNames = 'Layanan';
          }
          
          return {
            client_name: row.client_name || 'Client',
            service_names: serviceNames,
            amount: parseFloat(row.amount),
            payment_date: row.payment_date
          };
        });
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'unpaid':
        // Amount still unpaid
        queryStr = `
          SELECT 
            b.id,
            c.name as client_name,
            (b.total_price - COALESCE(p.amount_paid, 0)) as amount,
            b.booking_date,
            b.status,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND b.status != 'cancelled' AND (b.total_price - COALESCE(p.amount_paid, 0)) > 0
          ORDER BY b.booking_date DESC
        `;
        
        const unpaidResult = await query(queryStr, params);
        
        data = unpaidResult.rows.map(row => {
          let serviceNames = 'Layanan';
          try {
            if (row.services_json && row.services_json !== '[]') {
              const services = JSON.parse(row.services_json);
              if (Array.isArray(services) && services.length > 0) {
                serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
              }
            }
          } catch (e) {
            serviceNames = 'Layanan';
          }
          
          return {
            client_name: row.client_name || 'Client',
            service_names: serviceNames,
            amount: parseFloat(row.amount),
            booking_date: row.booking_date,
            status: row.status
          };
        });
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'expenses':
        // All expenses
        let expenseParams = [userId];
        let expenseDateFilter = '';
        
        if (month && year) {
          expenseDateFilter = ' AND EXTRACT(MONTH FROM e.expense_date) = $2::int AND EXTRACT(YEAR FROM e.expense_date) = $3::int';
          expenseParams = [userId, parseInt(month), parseInt(year)];
        }
        
        queryStr = `
          SELECT 
            e.id,
            e.description,
            e.amount,
            e.expense_date,
            c.name as category_name,
            c.icon,
            c.color
          FROM expenses e
          LEFT JOIN expense_categories c ON e.category_id = c.id
          WHERE e.user_id = $1 ${expenseDateFilter}
          ORDER BY e.expense_date DESC
        `;
        
        const expensesResult = await query(queryStr, expenseParams);
        
        data = expensesResult.rows.map(row => ({
          description: row.description || 'Pengeluaran',
          category_name: row.category_name || 'Kategori',
          amount: parseFloat(row.amount),
          date: row.expense_date
        }));
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'tax':
        // Tax from paid bookings (excluding cancelled)
        queryStr = `
          SELECT b.id, b.total_price, b.notes, c.name as client_name, b.booking_date,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN (
            SELECT booking_id, 
                   SUM(amount) as amount_paid,
                   MAX(payment_status) as payment_status
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND COALESCE(p.payment_status, 'unpaid') = 'paid' AND b.status != 'cancelled'
          ORDER BY b.booking_date DESC
        `;
        
        const taxResult = await query(queryStr, params);
        
        data = [];
        for (const booking of taxResult.rows) {
          try {
            if (booking.notes && booking.notes.trim().startsWith('{')) {
              const bookingDetails = JSON.parse(booking.notes);
              
              if (bookingDetails.services && bookingDetails.tax_percentage) {
                let subtotal = 0;
                if (Array.isArray(bookingDetails.services)) {
                  subtotal = bookingDetails.services.reduce((sum, service) => {
                    return sum + (parseFloat(service.custom_price || 0) * parseInt(service.quantity || 1));
                  }, 0);
                }
                
                const bookingDays = parseInt(bookingDetails.booking_days) || 1;
                subtotal = subtotal * bookingDays;
                
                if (bookingDetails.discount) {
                  if (bookingDetails.discount_type === 'persen') {
                    subtotal = subtotal * (1 - parseFloat(bookingDetails.discount) / 100);
                  } else {
                    subtotal = Math.max(0, subtotal - parseFloat(bookingDetails.discount));
                  }
                }
                
                const taxPercentage = parseFloat(bookingDetails.tax_percentage) || 0;
                const taxAmount = subtotal * (taxPercentage / 100);
                
                if (taxAmount > 0) {
                  let serviceNames = 'Layanan';
                  try {
                    if (booking.services_json && booking.services_json !== '[]') {
                      const services = JSON.parse(booking.services_json);
                      if (Array.isArray(services) && services.length > 0) {
                        serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
                      }
                    }
                  } catch (e) {
                    serviceNames = 'Layanan';
                  }
                  
                  data.push({
                    client_name: booking.client_name || 'Client',
                    service_names: serviceNames,
                    amount: taxAmount,
                    booking_date: booking.booking_date,
                    tax_percentage: taxPercentage
                  });
                }
              }
            }
          } catch (error) {
            console.log('Error parsing booking notes for tax detail:', error.message);
          }
        }
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'net-income':
        // Net income breakdown (revenue - expenses - tax + cancelled tax)
        // This will show all components that make up net income
        const components = [];
        
        // Get total revenue
        const revenueQuery = await query(`
          SELECT COALESCE(
            SUM(
              CASE 
                WHEN b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0 THEN 0
                ELSE CAST(b.total_price AS DECIMAL)
              END
            ), 0
          ) as total_revenue
          FROM bookings b
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND NOT (b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0)
        `, params);
        
        // Get total paid
        const paidQuery = await query(`
          SELECT COALESCE(SUM(CAST(COALESCE(p.amount_paid, 0) AS DECIMAL)), 0) as total_paid
          FROM bookings b
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter}
        `, params);
        
        // Get total expenses
        let expenseQueryParams = [userId];
        let expenseQueryDateFilter = '';
        
        if (month && year) {
          expenseQueryDateFilter = ' AND EXTRACT(MONTH FROM expense_date) = $2::int AND EXTRACT(YEAR FROM expense_date) = $3::int';
          expenseQueryParams = [userId, parseInt(month), parseInt(year)];
        }
        
        const expenseQuery = await query(
          `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE user_id = $1 ${expenseQueryDateFilter}`,
          expenseQueryParams
        );
        
        const revenueAmount = parseFloat(revenueQuery.rows[0].total_revenue);
        const paidAmount = parseFloat(paidQuery.rows[0].total_paid);
        const expenseAmount = parseFloat(expenseQuery.rows[0].total_expenses);
        
        // For net income, we show the components
        data = [
          {
            description: 'Total Pendapatan',
            type: 'Pendapatan',
            amount: revenueAmount,
            date: new Date().toISOString().split('T')[0]
          },
          {
            description: 'Total Pengeluaran',
            type: 'Pengeluaran',
            amount: -expenseAmount,
            date: new Date().toISOString().split('T')[0]
          },
          {
            description: 'Total Diterima',
            type: 'Penerimaan',
            amount: paidAmount,
            date: new Date().toISOString().split('T')[0]
          }
        ];
        
        // Calculate net income
        total = paidAmount - expenseAmount;
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid detail type' });
    }
    
    res.json({
      success: true,
      data: data,
      total: total
    });
  } catch (error) {
    console.error('Error fetching financial details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============= BACKUP & RESTORE ENDPOINTS =============

// Get data statistics
app.get('/api/backup/stats', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts for all data
    const bookingsCount = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE user_id = $1',
      [userId]
    );
    
    const paymentsCount = await query(
      `SELECT COUNT(*) as count FROM payments p 
       INNER JOIN bookings b ON p.booking_id = b.id 
       WHERE b.user_id = $1`,
      [userId]
    );
    
    const expensesCount = await query(
      'SELECT COUNT(*) as count FROM expenses WHERE user_id = $1',
      [userId]
    );
    
    const clientsCount = await query(
      'SELECT COUNT(*) as count FROM clients WHERE user_id = $1',
      [userId]
    );
    
    const servicesCount = await query(
      'SELECT COUNT(*) as count FROM services WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalBookings: parseInt(bookingsCount.rows[0].count),
        totalPayments: parseInt(paymentsCount.rows[0].count),
        totalExpenses: parseInt(expensesCount.rows[0].count),
        totalClients: parseInt(clientsCount.rows[0].count),
        totalServices: parseInt(servicesCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching data stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data statistics'
    });
  }
});

// ============= DATA FETCH ENDPOINTS FOR SELECTIVE EXPORT =============

// Get all clients
app.get('/api/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const clients = await query(
      'SELECT id, name, email, phone, address, created_at FROM clients WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(clients.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
});

// Get all booking names
app.get('/api/booking-names', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingNames = await query(
      'SELECT id, name, created_at, updated_at FROM booking_names WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(bookingNames.rows);
  } catch (error) {
    console.error('Error fetching booking names:', error);
    res.status(500).json({ message: 'Failed to fetch booking names' });
  }
});

// Create new booking name
app.post('/api/booking-names', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Booking name is required' });
    }

    // Check if booking name already exists
    const existing = await query(
      'SELECT id FROM booking_names WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Booking name already exists' });
    }

    const result = await query(
      'INSERT INTO booking_names (name, user_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking name:', error);
    res.status(500).json({ message: 'Failed to create booking name' });
  }
});

// Delete booking name
app.delete('/api/booking-names/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify booking name belongs to the user
    const bookingName = await query(
      'SELECT id FROM booking_names WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (bookingName.rows.length === 0) {
      return res.status(404).json({ message: 'Booking name not found' });
    }

    await query('DELETE FROM booking_names WHERE id = $1', [id]);
    res.json({ message: 'Booking name deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking name:', error);
    res.status(500).json({ message: 'Failed to delete booking name' });
  }
});

// Get all services
app.get('/api/services', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const services = await query(
      'SELECT id, name, description, price, duration, created_at FROM services WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(services.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// Get all bookings with client and service names
app.get('/api/bookings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await query(
      `SELECT b.id, b.client_id, b.service_id, b.booking_date, b.booking_time, b.status, 
              b.total_price, b.notes, b.created_at, b.booking_name,
              c.name as client_name, s.name as service_name,
              p.payment_status, p.amount as amount_paid
       FROM bookings b
       LEFT JOIN clients c ON b.client_id = c.id
       LEFT JOIN services s ON b.service_id = s.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [userId]
    );
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get all payments with client names
app.get('/api/payments', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await query(
      `SELECT p.id, p.booking_id, p.amount, p.payment_method, p.payment_date, p.notes, p.created_at,
              c.name as client_name
       FROM payments p
       INNER JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN clients c ON b.client_id = c.id
       WHERE b.user_id = $1
       ORDER BY p.payment_date DESC`,
      [userId]
    );
    res.json(payments.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get all expenses with category names
app.get('/api/expenses', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await query(
      `SELECT e.id, e.category_id, e.amount, e.description, e.expense_date, e.notes, e.created_at,
              ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.user_id = $1
       ORDER BY e.expense_date DESC`,
      [userId]
    );
    res.json(expenses.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// Get all expense categories
app.get('/api/expense-categories', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await query(
      'SELECT id, name, created_at, is_default, user_id FROM expense_categories WHERE user_id = $1 OR user_id IS NULL ORDER BY is_default DESC, name',
      [userId]
    );
    console.log(`📊 Fetched ${categories.rows.length} expense categories for user ${userId} (including defaults)`);
    res.json(categories.rows);
  } catch (error) {
    console.error('❌ Error fetching expense categories:', error);
    res.status(500).json({ message: 'Failed to fetch expense categories' });
  }
});

// Export to Excel
app.get('/api/backup/export/:format', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { format } = req.params; // 'xlsx' only

    // Validate format
    if (format !== 'xlsx') {
      return res.status(400).json({ message: 'Invalid format. Only xlsx is supported.' });
    }

    // Import required libraries
    const ExcelJS = require('exceljs');

    // Get selection from query params (default all true)
    const selection = {
      companySettings: req.query.companySettings !== 'false',
      clients: req.query.clients !== 'false',
      services: req.query.services !== 'false',
      responsibleParties: req.query.responsibleParties !== 'false',
      serviceResponsibleParties: req.query.serviceResponsibleParties !== 'false',
      bookingNames: req.query.bookingNames !== 'false',
      bookings: req.query.bookings !== 'false',
      payments: req.query.payments !== 'false',
      expenses: req.query.expenses !== 'false',
      expenseCategories: req.query.expenseCategories !== 'false'
    };

    // Get selected IDs from query params
    const selectedIds = {
      clients: req.query.clientsIds ? JSON.parse(req.query.clientsIds) : null,
      services: req.query.servicesIds ? JSON.parse(req.query.servicesIds) : null,
      responsibleParties: req.query.responsiblePartiesIds ? JSON.parse(req.query.responsiblePartiesIds) : null,
      serviceResponsibleParties: req.query.serviceResponsiblePartiesIds ? JSON.parse(req.query.serviceResponsiblePartiesIds) : null,
      bookingNames: req.query.bookingNamesIds ? JSON.parse(req.query.bookingNamesIds) : null,
      bookings: req.query.bookingsIds ? JSON.parse(req.query.bookingsIds) : null,
      payments: req.query.paymentsIds ? JSON.parse(req.query.paymentsIds) : null,
      expenses: req.query.expensesIds ? JSON.parse(req.query.expensesIds) : null,
      expenseCategories: req.query.expenseCategoriesIds ? JSON.parse(req.query.expenseCategoriesIds) : null
    };

    console.log('📊 Excel/CSV Export selection:', selection);
    console.log('🔍 Selected IDs:', selectedIds);

    // Helper function to format currency
    const formatCurrency = (amount) => {
      if (!amount && amount !== 0) return 'Rp 0';
      try {
        return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
      } catch (error) {
        return `Rp ${amount}`;
      }
    };

    // Helper function to format date
    const formatDate = (date) => {
      if (!date) return '';
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
      } catch (error) {
        return date;
      }
    };

    // Helper function to parse notes
    const parseNotes = (notes) => {
      if (!notes) return '';
      try {
        const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
        return parsed.text || parsed.notes || '';
      } catch (e) {
        return notes;
      }
    };

    // Helper function to style worksheet with borders and header
    const styleWorksheet = (worksheet) => {
      // Style header row (first row)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      
      // Define numeric columns that should be center-aligned
      const numericColumns = ['id', 'service_quantity', 'booking_days', 'tax_percentage', 'total_price', 'amount_paid', 'remaining_amount', 'discount'];
      
      // Apply borders to all cells
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          
          // Data rows alignment
          if (rowNumber > 1) {
            // Check if this column contains numeric data
            const columnKey = worksheet.columns[colNumber - 1]?.key;
            if (numericColumns.includes(columnKey)) {
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            } else {
              cell.alignment = { vertical: 'top', wrapText: true };
            }
          }
        });
      });
    };

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CatatJasamu';
    workbook.created = new Date();

    // Fetch and add Bookings sheet if selected
    if (selection.bookings) {
      console.log('📊 Starting bookings export...');
      let bookingsQuery = `SELECT 
        b.id, b.booking_date, b.booking_time,
        c.name as client_name, c.phone as client_phone, c.address as client_address,
        b.location_name, b.booking_name,
        b.total_price, b.status, b.notes,
        COALESCE(p.amount_paid, 0) as amount_paid,
        CASE 
          WHEN COALESCE(p.amount_paid, 0) = 0 THEN 'Belum Bayar'
          WHEN COALESCE(p.amount_paid, 0) >= b.total_price THEN 'Lunas'
          ELSE 'Bayar Sebagian'
        END as payment_status,
        (b.total_price - COALESCE(p.amount_paid, 0)) as remaining_amount
       FROM bookings b 
       LEFT JOIN clients c ON b.client_id = c.id 
       LEFT JOIN (
         SELECT booking_id, SUM(amount) as amount_paid
         FROM payments
         GROUP BY booking_id
       ) p ON b.id = p.booking_id
       WHERE b.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.bookings && selectedIds.bookings.length > 0) {
        bookingsQuery += ' AND b.id = ANY($2::int[])';
        params.push(selectedIds.bookings);
      }
      
      bookingsQuery += ' ORDER BY b.booking_date DESC, b.booking_time DESC';
      const bookings = await query(bookingsQuery, params);
      
      if (bookings.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Booking');
        
        // Define columns
        worksheet.columns = [
          { header: 'ID Booking', key: 'id', width: 12 },
          { header: 'Nama Booking', key: 'booking_name', width: 25 },
          { header: 'Tanggal Mulai', key: 'booking_date', width: 20 },
          { header: 'Tanggal Selesai', key: 'booking_date_end', width: 20 },
          { header: 'Waktu Mulai', key: 'booking_time', width: 15 },
          { header: 'Waktu Selesai', key: 'booking_time_end', width: 15 },
          { header: 'Nama Klien', key: 'client_name', width: 28 },
          { header: 'Telepon Klien', key: 'client_phone', width: 18 },
          { header: 'Alamat Klien', key: 'client_address', width: 40 },
          { header: 'Nama Lokasi', key: 'location_name', width: 30 },
          { header: 'Penanggung Jawab', key: 'responsible_parties', width: 35 },
          { header: 'Layanan Dipesan', key: 'services_ordered', width: 50 },
          { header: 'Jumlah Layanan', key: 'service_quantity', width: 15 },
          { header: 'Durasi (Hari)', key: 'booking_days', width: 15 },
          { header: 'Biaya Tambahan', key: 'additional_fees', width: 30 },
          { header: 'Diskon', key: 'discount', width: 15 },
          { header: 'Pajak (%)', key: 'tax_percentage', width: 12 },
          { header: 'Total Harga', key: 'total_price', width: 18 },
          { header: 'Status Booking', key: 'status', width: 15 },
          { header: 'Status Pembayaran', key: 'payment_status', width: 18 },
          { header: 'Jumlah Dibayar', key: 'amount_paid', width: 18 },
          { header: 'Sisa Pembayaran', key: 'remaining_amount', width: 18 },
          { header: 'Catatan Booking', key: 'notes', width: 45 }
        ];
        
        // Add rows
        bookings.rows.forEach(row => {
          // Parse booking details from notes JSON
          let bookingDetails = {
            booking_date_end: '',
            booking_time_end: '',
            booking_days: 1,
            responsible_parties: '',
            services_ordered: '',
            service_quantity: 1,
            additional_fees: '',
            discount: 0,
            tax_percentage: 0,
            user_notes: ''
          };

          try {
            if (row.notes && typeof row.notes === 'string' && row.notes.trim().startsWith('{')) {
              const notesObj = JSON.parse(row.notes);

              // Extract booking dates and times
              bookingDetails.booking_date_end = notesObj.booking_date_end || '';
              bookingDetails.booking_time_end = notesObj.booking_time_end || '';

              // Calculate booking days
              if (notesObj.booking_days) {
                bookingDetails.booking_days = notesObj.booking_days;
              } else if (notesObj.booking_date && notesObj.booking_date_end) {
                const startDate = new Date(notesObj.booking_date);
                const endDate = new Date(notesObj.booking_date_end);
                const diffTime = Math.abs(endDate - startDate);
                bookingDetails.booking_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              }

              // Extract responsible parties
              if (notesObj.responsible_parties && Array.isArray(notesObj.responsible_parties)) {
                bookingDetails.responsible_parties = notesObj.responsible_parties
                  .map(rp => rp.name)
                  .join(', ');
              }

              // Extract services ordered with prices
              if (notesObj.services && Array.isArray(notesObj.services)) {
                bookingDetails.service_quantity = notesObj.services.reduce((sum, service) => sum + (parseInt(service.quantity) || 1), 0);
                bookingDetails.services_ordered = notesObj.services
                  .map(service => `${service.service_name || 'Unknown'} (${service.quantity || 1}x) - ${(service.custom_price || 0)}`)
                  .join('\n');
              }

              // Extract additional fees
              if (notesObj.additional_fees && Array.isArray(notesObj.additional_fees)) {
                bookingDetails.additional_fees = notesObj.additional_fees
                  .map(fee => `${fee.description}: ${(fee.amount || 0)}`)
                  .join('\n');
              }

              // Extract discount and tax
              bookingDetails.discount = notesObj.discount || 0;
              bookingDetails.discount_type = notesObj.discount_type || 'rupiah';
              bookingDetails.tax_percentage = notesObj.tax_percentage || 0;

              // Extract user notes
              bookingDetails.user_notes = notesObj.user_notes || '';
            }
          } catch (e) {
            // Ignore parsing errors, use defaults
            console.log('Error parsing booking notes:', e.message);
          }

          worksheet.addRow({
            id: row.id,
            booking_name: row.booking_name || '',
            booking_date: formatDate(row.booking_date),
            booking_date_end: bookingDetails.booking_date_end ? formatDate(bookingDetails.booking_date_end) : '',
            booking_time: row.booking_time || '',
            booking_time_end: bookingDetails.booking_time_end || '',
            client_name: row.client_name || '',
            client_phone: row.client_phone || '',
            client_address: row.client_address || '',
            location_name: row.location_name || '',
            responsible_parties: bookingDetails.responsible_parties,
            services_ordered: bookingDetails.services_ordered,
            service_quantity: bookingDetails.service_quantity,
            booking_days: bookingDetails.booking_days,
            additional_fees: bookingDetails.additional_fees,
            discount: bookingDetails.discount || 0,
            tax_percentage: bookingDetails.tax_percentage || 0,
            total_price: row.total_price || 0,
            status: row.status || '',
            payment_status: row.payment_status || 'Belum Bayar',
            amount_paid: row.amount_paid || 0,
            remaining_amount: row.remaining_amount || 0,
            notes: bookingDetails.user_notes
          });
        });
        
        // Apply styling
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${bookings.rows.length} bookings`);
      }
    }

    // Fetch and add Booking Names sheet if selected
    if (selection.bookingNames) {
      console.log('🏷️ Starting booking names export...');
      let bookingNamesQuery = 'SELECT id, name, created_at, updated_at FROM booking_names WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.bookingNames && selectedIds.bookingNames.length > 0) {
        bookingNamesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.bookingNames);
      }
      
      bookingNamesQuery += ' ORDER BY name';
      const bookingNames = await query(bookingNamesQuery, params);
      
      if (bookingNames.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Nama Booking');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Booking', key: 'name', width: 40 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 22 },
          { header: 'Terakhir Diubah', key: 'updated_at', width: 22 }
        ];
        
        bookingNames.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${bookingNames.rows.length} booking names`);
      }
    }

    // Fetch and add Expenses sheet if selected
    if (selection.expenses) {
      let expensesQuery = `SELECT 
        e.id, e.expense_date,
        ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
        e.amount, e.description, e.notes,
        e.created_at, e.updated_at
       FROM expenses e 
       LEFT JOIN expense_categories ec ON e.category_id = ec.id 
       WHERE e.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.expenses && selectedIds.expenses.length > 0) {
        expensesQuery += ' AND e.id = ANY($2::int[])';
        params.push(selectedIds.expenses);
      }
      
      expensesQuery += ' ORDER BY e.expense_date DESC';
      const expenses = await query(expensesQuery, params);
      
      if (expenses.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Pengeluaran');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Tanggal Pengeluaran', key: 'expense_date', width: 22 },
          { header: 'Kategori Pengeluaran', key: 'category_name', width: 28 },
          { header: 'Jumlah', key: 'amount', width: 18 },
          { header: 'Deskripsi', key: 'description', width: 40 },
          { header: 'Catatan', key: 'notes', width: 40 }
        ];
        
        expenses.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            expense_date: formatDate(row.expense_date),
            category_name: row.category_name || '',
            amount: row.amount ? formatCurrency(row.amount) : 'Rp 0',
            description: row.description || '',
            notes: row.notes || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${expenses.rows.length} expenses`);
      }
    }

    // Fetch and add Expense Categories sheet if selected
    if (selection.expenseCategories) {
      let categoriesQuery = `SELECT 
        id, name, icon, color,
        created_at, updated_at
       FROM expense_categories 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.expenseCategories && selectedIds.expenseCategories.length > 0) {
        categoriesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.expenseCategories);
      }
      
      categoriesQuery += ' ORDER BY name';
      const expenseCategories = await query(categoriesQuery, params);
      
      if (expenseCategories.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Kategori Pengeluaran');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Kategori', key: 'name', width: 32 },
          { header: 'Icon', key: 'icon', width: 14 },
          { header: 'Warna', key: 'color', width: 18 }
        ];
        
        expenseCategories.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            icon: row.icon || '',
            color: row.color || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${expenseCategories.rows.length} expense categories`);
      }
    }

    // Fetch and add Clients sheet if selected
    if (selection.clients) {
      let clientsQuery = `SELECT 
        id, name, phone, address
       FROM clients 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.clients && selectedIds.clients.length > 0) {
        clientsQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.clients);
      }
      
      clientsQuery += ' ORDER BY name';
      const clients = await query(clientsQuery, params);
      
      if (clients.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Klien');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Klien', key: 'name', width: 32 },
          { header: 'Telepon', key: 'phone', width: 18 },
          { header: 'Alamat', key: 'address', width: 45 }
        ];
        
        clients.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${clients.rows.length} clients`);
      }
    }

    // Fetch and add Services sheet if selected
    if (selection.services) {
      let servicesQuery = `SELECT 
        id, name, price, duration
       FROM services 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.services && selectedIds.services.length > 0) {
        servicesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.services);
      }
      
      servicesQuery += ' ORDER BY name';
      const services = await query(servicesQuery, params);
      
      if (services.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Layanan');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Layanan', key: 'name', width: 32 },
          { header: 'Harga', key: 'price', width: 18 },
          { header: 'Durasi (menit)', key: 'duration', width: 18 }
        ];
        
        services.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            price: row.price ? formatCurrency(row.price) : 'Rp 0',
            duration: row.duration || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${services.rows.length} services`);
      }
    }

    // Fetch and add Responsible Parties sheet if selected
    if (selection.responsibleParties) {
      let responsiblePartiesQuery = `SELECT 
        id, name, phone, address,
        created_at, updated_at
       FROM responsible_parties 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.responsibleParties && selectedIds.responsibleParties.length > 0) {
        responsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.responsibleParties);
      }
      
      responsiblePartiesQuery += ' ORDER BY name';
      const responsibleParties = await query(responsiblePartiesQuery, params);
      
      if (responsibleParties.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Penanggung Jawab');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama', key: 'name', width: 32 },
          { header: 'Telepon', key: 'phone', width: 18 },
          { header: 'Alamat', key: 'address', width: 40 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        responsibleParties.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${responsibleParties.rows.length} responsible parties`);
      }
    }

    // Fetch and add Service Responsible Parties sheet if selected
    if (selection.serviceResponsibleParties) {
      let serviceResponsiblePartiesQuery = `SELECT
        srp.id, rp.name, rp.phone, rp.address, srp.service_id,
        srp.created_at, srp.updated_at
       FROM service_responsible_parties srp
       JOIN responsible_parties rp ON srp.responsible_party_id = rp.id
       WHERE rp.user_id = $1`;
      const params = [userId];

      if (selectedIds.serviceResponsibleParties && selectedIds.serviceResponsibleParties.length > 0) {
        serviceResponsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.serviceResponsibleParties);
      }

      serviceResponsiblePartiesQuery += ' ORDER BY name';
      const serviceResponsibleParties = await query(serviceResponsiblePartiesQuery, params);

      if (serviceResponsibleParties.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Penanggung Jawab Layanan');

        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama', key: 'name', width: 32 },
          { header: 'Telepon', key: 'phone', width: 18 },
          { header: 'Alamat', key: 'address', width: 40 },
          { header: 'ID Layanan', key: 'service_id', width: 12 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];

        serviceResponsibleParties.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || '',
            service_id: row.service_id || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });

        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${serviceResponsibleParties.rows.length} service responsible parties`);
      }
    }

    // Add company settings sheet (if selected and exists)
    if (selection.companySettings) {
      const companySettings = await query(
        `SELECT 
          company_name, company_address, company_phone, company_email,
          bank_name, account_number, account_holder_name,
          bank_name_alt, account_number_alt, account_holder_name_alt
         FROM company_settings 
         WHERE user_id = $1`,
        [userId]
      );
      
      if (companySettings.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Pengaturan Perusahaan');
        
        worksheet.columns = [
          { header: 'Nama Perusahaan', key: 'company_name', width: 32 },
          { header: 'Alamat', key: 'company_address', width: 48 },
          { header: 'Telepon', key: 'company_phone', width: 18 },
          { header: 'Email', key: 'company_email', width: 30 },
          { header: 'Informasi Rekening', key: 'bank_accounts', width: 50 }
        ];
        
        companySettings.rows.forEach(row => {
          // Build bank accounts info
          let bankAccounts = '';
          if (row.bank_name && row.account_number) {
            bankAccounts += `${row.bank_name}: ${row.account_number}`;
            if (row.account_holder_name) {
              bankAccounts += ` (${row.account_holder_name})`;
            }
            bankAccounts += '\n';
          }
          
          if (row.bank_name_alt && row.account_number_alt) {
            bankAccounts += `${row.bank_name_alt}: ${row.account_number_alt}`;
            if (row.account_holder_name_alt) {
              bankAccounts += ` (${row.account_holder_name_alt})`;
            }
          }
          
          worksheet.addRow({
            company_name: row.company_name || '',
            company_address: row.company_address || '',
            company_phone: row.company_phone || '',
            company_email: row.company_email || '',
            bank_accounts: bankAccounts.trim()
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported company settings`);
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=backup_data_${new Date().toISOString().split('T')[0]}.xlsx`);

    console.log(`✅ Export XLSX completed successfully`);
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error exporting to Excel/CSV:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export data: ' + error.message
    });
  }
});

// Test endpoint without auth
app.get('/api/test/backup/export/:format', async (req, res) => {
  try {
    console.log('🔄 Starting XLSX export process (TEST)...');
    const userId = 1; // Test user ID
    const { format } = req.params; // 'xlsx' only

    // Validate format
    if (format !== 'xlsx') {
      return res.status(400).json({ message: 'Invalid format. Only xlsx is supported.' });
    }

    console.log('📊 User ID:', userId, 'Format:', format);
    res.json({ message: 'Test endpoint working' });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export full backup (JSON) - NEW ENDPOINT to avoid browser cache
app.get('/api/backup/download-json', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get selection from query params (default all true)
    const selection = {
      companySettings: req.query.companySettings !== 'false',
      clients: req.query.clients !== 'false',
      services: req.query.services !== 'false',
      responsibleParties: req.query.responsibleParties !== 'false',
      serviceResponsibleParties: req.query.serviceResponsibleParties !== 'false',
      bookingNames: req.query.bookingNames !== 'false',
      bookings: req.query.bookings !== 'false',
      payments: req.query.payments !== 'false',
      expenses: req.query.expenses !== 'false',
      expenseCategories: req.query.expenseCategories !== 'false'
    };

    // Get selected IDs from query params
    const selectedIds = {
      clients: req.query.clientsIds ? JSON.parse(req.query.clientsIds) : null,
      services: req.query.servicesIds ? JSON.parse(req.query.servicesIds) : null,
      responsibleParties: req.query.responsiblePartiesIds ? JSON.parse(req.query.responsiblePartiesIds) : null,
      serviceResponsibleParties: req.query.serviceResponsiblePartiesIds ? JSON.parse(req.query.serviceResponsiblePartiesIds) : null,
      bookingNames: req.query.bookingNamesIds ? JSON.parse(req.query.bookingNamesIds) : null,
      bookings: req.query.bookingsIds ? JSON.parse(req.query.bookingsIds) : null,
      payments: req.query.paymentsIds ? JSON.parse(req.query.paymentsIds) : null,
      expenses: req.query.expensesIds ? JSON.parse(req.query.expensesIds) : null,
      expenseCategories: req.query.expenseCategoriesIds ? JSON.parse(req.query.expenseCategoriesIds) : null
    };

    console.log('📦 Export selection:', selection);
    console.log('🔍 Selected IDs:', selectedIds);

    const backup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userId: userId,
      selection: selection, // Include selection info in backup
      data: {}
    };

    // Fetch clients if selected
    if (selection.clients) {
      let clientsQuery = 'SELECT * FROM clients WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.clients && selectedIds.clients.length > 0) {
        clientsQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.clients);
      }
      
      clientsQuery += ' ORDER BY created_at';
      const clients = await query(clientsQuery, params);
      backup.data.clients = clients.rows;
      console.log(`  ✅ Exported ${clients.rows.length} clients`);
    } else {
      backup.data.clients = [];
      console.log(`  ⏭️  Skipped clients`);
    }

    // Fetch services if selected
    if (selection.services) {
      let servicesQuery = 'SELECT * FROM services WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.services && selectedIds.services.length > 0) {
        servicesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.services);
      }
      
      servicesQuery += ' ORDER BY created_at';
      const services = await query(servicesQuery, params);
      backup.data.services = services.rows;
      console.log(`  ✅ Exported ${services.rows.length} services`);
    } else {
      backup.data.services = [];
      console.log(`  ⏭️  Skipped services`);
    }

    // Fetch responsible parties if selected
    if (selection.responsibleParties) {
      let responsiblePartiesQuery = 'SELECT * FROM responsible_parties WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.responsibleParties && selectedIds.responsibleParties.length > 0) {
        responsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.responsibleParties);
      }
      
      responsiblePartiesQuery += ' ORDER BY created_at';
      const responsibleParties = await query(responsiblePartiesQuery, params);
      backup.data.responsibleParties = responsibleParties.rows;
      console.log(`  ✅ Exported ${responsibleParties.rows.length} responsible parties`);
    } else {
      backup.data.responsibleParties = [];
      console.log(`  ⏭️  Skipped responsible parties`);
    }

    // Fetch service responsible parties if selected
    if (selection.serviceResponsibleParties) {
      let serviceResponsiblePartiesQuery = `SELECT srp.*, rp.name, rp.phone, rp.address
        FROM service_responsible_parties srp
        JOIN responsible_parties rp ON srp.responsible_party_id = rp.id
        WHERE rp.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.serviceResponsibleParties && selectedIds.serviceResponsibleParties.length > 0) {
        serviceResponsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.serviceResponsibleParties);
      }
      
      serviceResponsiblePartiesQuery += ' ORDER BY created_at';
      const serviceResponsibleParties = await query(serviceResponsiblePartiesQuery, params);
      backup.data.serviceResponsibleParties = serviceResponsibleParties.rows;
      console.log(`  ✅ Exported ${serviceResponsibleParties.rows.length} service responsible parties`);
    } else {
      backup.data.serviceResponsibleParties = [];
      console.log(`  ⏭️  Skipped service responsible parties`);
    }

    // Fetch booking names if selected
    if (selection.bookingNames) {
      let bookingNamesQuery = 'SELECT * FROM booking_names WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.bookingNames && selectedIds.bookingNames.length > 0) {
        bookingNamesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.bookingNames);
      }
      
      bookingNamesQuery += ' ORDER BY name';
      const bookingNames = await query(bookingNamesQuery, params);
      backup.data.bookingNames = bookingNames.rows;
      console.log(`  ✅ Exported ${bookingNames.rows.length} booking names`);
    } else {
      backup.data.bookingNames = [];
      console.log(`  ⏭️  Skipped booking names`);
    }

    // Fetch bookings if selected (with client and service names for duplicate detection)
    if (selection.bookings) {
      let bookingsQuery = `
        SELECT b.*,
               c.name as client_name,
               s.name as service_name
        FROM bookings b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.user_id = $1
      `;
      const params = [userId];
      
      if (selectedIds.bookings && selectedIds.bookings.length > 0) {
        bookingsQuery += ' AND b.id = ANY($2::int[])';
        params.push(selectedIds.bookings);
      }
      
      bookingsQuery += ' ORDER BY b.created_at';
      const bookings = await query(bookingsQuery, params);
      backup.data.bookings = bookings.rows;
      console.log(`  ✅ Exported ${bookings.rows.length} bookings (with client & service names)`);
    } else {
      backup.data.bookings = [];
      console.log(`  ⏭️  Skipped bookings`);
    }

    // Fetch payments if selected
    if (selection.payments) {
      let paymentsQuery = `SELECT p.* FROM payments p 
                           INNER JOIN bookings b ON p.booking_id = b.id 
                           WHERE b.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.payments && selectedIds.payments.length > 0) {
        paymentsQuery += ' AND p.id = ANY($2::int[])';
        params.push(selectedIds.payments);
      }
      
      paymentsQuery += ' ORDER BY p.created_at';
      const payments = await query(paymentsQuery, params);
      backup.data.payments = payments.rows;
      console.log(`  ✅ Exported ${payments.rows.length} payments`);
    } else {
      backup.data.payments = [];
      console.log(`  ⏭️  Skipped payments`);
    }

    // Fetch expense categories if selected (including default/system categories)
    if (selection.expenseCategories) {
      let categoriesQuery = 'SELECT * FROM expense_categories WHERE (user_id = $1 OR user_id IS NULL)';
      const params = [userId];
      
      if (selectedIds.expenseCategories && selectedIds.expenseCategories.length > 0) {
        categoriesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.expenseCategories);
      }
      
      categoriesQuery += ' ORDER BY is_default DESC, created_at';
      const expenseCategories = await query(categoriesQuery, params);
      backup.data.expenseCategories = expenseCategories.rows;
      console.log(`  ✅ Exported ${expenseCategories.rows.length} expense categories (including defaults)`);
    } else {
      backup.data.expenseCategories = [];
      console.log(`  ⏭️  Skipped expense categories`);
    }

    // Fetch expenses if selected (with category name for duplicate detection)
    if (selection.expenses) {
      let expensesQuery = `
        SELECT e.*,
               ec.name as category_name
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.user_id = $1
      `;
      const params = [userId];
      
      if (selectedIds.expenses && selectedIds.expenses.length > 0) {
        expensesQuery += ' AND e.id = ANY($2::int[])';
        params.push(selectedIds.expenses);
      }
      
      expensesQuery += ' ORDER BY e.created_at';
      const expenses = await query(expensesQuery, params);
      backup.data.expenses = expenses.rows;
      console.log(`  ✅ Exported ${expenses.rows.length} expenses (with category names)`);
    } else {
      backup.data.expenses = [];
      console.log(`  ⏭️  Skipped expenses`);
    }

    // Fetch company settings if selected (including bank info)
    if (selection.companySettings) {
      const companySettings = await query(
        'SELECT * FROM company_settings WHERE user_id = $1',
        [userId]
      );
      backup.data.companySettings = companySettings.rows[0] || null;
      if (companySettings.rows[0]) {
        const hasBank = !!(companySettings.rows[0].bank_name || companySettings.rows[0].account_number);
        console.log(`  ✅ Exported company settings ${hasBank ? '(with bank info)' : '(no bank info)'}`);
      } else {
        console.log(`  ✅ Exported company settings (empty)`);
      }
    } else {
      backup.data.companySettings = null;
      console.log(`  ⏭️  Skipped company settings`);
    }

    console.log('✅ Export completed successfully');

    // Set headers and send as download
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=backup_full_data_${new Date().toISOString().split('T')[0]}.json`);
    // Prevent browser caching to ensure fresh JSON export
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send as string to avoid double JSON encoding
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Error exporting full backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export full backup'
    });
  }
});

// Import backup data
// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/backup/import', authenticate, enforceTenancy, upload.single('backupFile'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { importType } = req.body; // 'replace' or 'add'
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

        // Validate file is JSON
        if (req.file.mimetype !== 'application/json' && !req.file.originalname.endsWith('.json')) {
          return res.status(400).json({
            success: false,
            message: 'File harus berformat JSON. Silakan export menggunakan "Export Backup JSON" terlebih dahulu.'
          });
        }

        // Parse JSON with error handling
        let backupData;
        try {
          const fileContent = req.file.buffer.toString();
          console.log('📄 File info:', {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            contentPreview: fileContent.substring(0, 200)
          });
          backupData = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError.message);
          return res.status(400).json({
            success: false,
            message: 'File bukan format JSON yang valid. Pastikan Anda menggunakan file dari "Export Backup JSON".'
          });
        }

        // Validate backup format
        if (!backupData.version || !backupData.data) {
          return res.status(400).json({
            success: false,
            message: 'Format backup tidak valid. File harus dari "Export Backup JSON".'
          });
        }

        // Start transaction
        await query('BEGIN');

        if (importType === 'replace') {
          console.log('🔄 Replace mode: Deleting existing data...');
          
          // Delete all existing data (in correct order due to foreign keys)
          // Must delete child tables first before parent tables
          
          // 1. Delete payments (references bookings)
          const paymentsDeleted = await query(
            `DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = $1)`,
            [userId]
          );
          console.log(`  ✅ Deleted ${paymentsDeleted.rowCount} payments`);
          
          // 2. Delete expenses (references user)
          const expensesDeleted = await query('DELETE FROM expenses WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${expensesDeleted.rowCount} expenses`);
          
          // 3. Delete expense_categories (references user)
          const expenseCategoriesDeleted = await query('DELETE FROM expense_categories WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${expenseCategoriesDeleted.rowCount} expense categories`);
          
          // 4. Delete bookings (references clients and services)
          const bookingsDeleted = await query('DELETE FROM bookings WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${bookingsDeleted.rowCount} bookings`);
          
          // 5. Delete clients (can be referenced by bookings)
          const clientsDeleted = await query('DELETE FROM clients WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${clientsDeleted.rowCount} clients`);
          
          // 6. Delete services (can be referenced by bookings)
          const servicesDeleted = await query('DELETE FROM services WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${servicesDeleted.rowCount} services`);
          
          // 7. Delete service_responsible_parties (references services and responsible_parties)
          const serviceResponsiblePartiesDeleted = await query(`
            DELETE FROM service_responsible_parties 
            WHERE responsible_party_id IN (
              SELECT id FROM responsible_parties WHERE user_id = $1
            )
          `, [userId]);
          console.log(`  ✅ Deleted ${serviceResponsiblePartiesDeleted.rowCount} service responsible parties`);
          
          // 8. Delete responsible_parties (can be referenced by service_responsible_parties)
          const responsiblePartiesDeleted = await query('DELETE FROM responsible_parties WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${responsiblePartiesDeleted.rowCount} responsible parties`);
          
          // 9. Delete booking_names (references user)
          const bookingNamesDeleted = await query('DELETE FROM booking_names WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${bookingNamesDeleted.rowCount} booking names`);
          
          // 10. Delete company_settings (references user)
          const settingsDeleted = await query('DELETE FROM company_settings WHERE user_id = $1', [userId]);
          console.log(`  ✅ Deleted ${settingsDeleted.rowCount} company settings`);
          
          console.log('✅ All existing data deleted successfully');
        }

        // Import clients
        // For 'replace' mode: import ALL clients
        // For 'add' mode: import only those flagged for import (not duplicates)
        const importFlags = backupData.importFlags || {};
        const clientImportIndices = new Set(importFlags.clients || []);
        
        if (backupData.data.clients && backupData.data.clients.length > 0) {
          for (let i = 0; i < backupData.data.clients.length; i++) {
            const client = backupData.data.clients[i];
            // Import if: replace mode (import all) OR add mode with flag
            const shouldImport = importType === 'replace' || clientImportIndices.has(i);
            
            if (shouldImport) {
              await query(
                `INSERT INTO clients (user_id, name, phone, email, address, notes, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userId, client.name, client.phone, client.email, client.address, client.notes, client.created_at, client.updated_at]
              );
              console.log(`  ✅ Imported client: ${client.name}`);
            }
          }
        }

        // Import services
        // For 'replace' mode: import ALL services
        // For 'add' mode: import only those flagged for import (not duplicates)
        const serviceImportIndices = new Set(importFlags.services || []);
        
        if (backupData.data.services && backupData.data.services.length > 0) {
          for (let i = 0; i < backupData.data.services.length; i++) {
            const service = backupData.data.services[i];
            // Import if: replace mode (import all) OR add mode with flag
            const shouldImport = importType === 'replace' || serviceImportIndices.has(i);
            
            if (shouldImport) {
              await query(
                `INSERT INTO services (user_id, name, description, price, duration, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, service.name, service.description, service.price, service.duration, service.created_at, service.updated_at]
              );
              console.log(`  ✅ Imported service: ${service.name}`);
            }
          }
        }

        // Import responsible parties
        // For 'replace' mode: import ALL responsible parties
        // For 'add' mode: import only those flagged for import (not duplicates)
        const responsiblePartyImportIndices = new Set(importFlags.responsibleParties || []);
        
        if (backupData.data.responsibleParties && backupData.data.responsibleParties.length > 0) {
          for (let i = 0; i < backupData.data.responsibleParties.length; i++) {
            const responsibleParty = backupData.data.responsibleParties[i];
            // Import if: replace mode (import all) OR add mode with flag
            const shouldImport = importType === 'replace' || responsiblePartyImportIndices.has(i);
            
            if (shouldImport) {
              await query(
                `INSERT INTO responsible_parties (user_id, name, phone, address, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, responsibleParty.name, responsibleParty.phone, responsibleParty.address || null, responsibleParty.created_at, responsibleParty.updated_at]
              );
              console.log(`  ✅ Imported responsible party: ${responsibleParty.name}`);
            }
          }
        }

        // Create ID mappings for services and responsible parties (needed for service_responsible_parties)
        const serviceIdMap = {};
        const responsiblePartyIdMap = {};

        // Get all services and responsible parties for mapping
        const newServices = await query('SELECT id, name FROM services WHERE user_id = $1', [userId]);
        const newResponsibleParties = await query('SELECT id, name, phone FROM responsible_parties WHERE user_id = $1', [userId]);

        // Create mapping from old backup data to new database IDs
        if (backupData.data.services && backupData.data.services.length > 0) {
          for (const oldService of backupData.data.services) {
            const matchingService = newServices.rows.find(s => 
              s.name && oldService.name && s.name.trim().toLowerCase() === oldService.name.trim().toLowerCase()
            );
            if (matchingService) {
              serviceIdMap[oldService.id] = matchingService.id;
            }
          }
        }

        if (backupData.data.responsibleParties && backupData.data.responsibleParties.length > 0) {
          for (const oldResponsibleParty of backupData.data.responsibleParties) {
            const matchingResponsibleParty = newResponsibleParties.rows.find(rp => 
              (rp.name && oldResponsibleParty.name && rp.name.trim().toLowerCase() === oldResponsibleParty.name.trim().toLowerCase()) ||
              (rp.phone && oldResponsibleParty.phone && rp.phone.replace(/\D/g, '') === oldResponsibleParty.phone.replace(/\D/g, ''))
            );
            if (matchingResponsibleParty) {
              responsiblePartyIdMap[oldResponsibleParty.id] = matchingResponsibleParty.id;
            }
          }
        }

        console.log('📊 Service & Responsible Party ID Mapping Summary:');
        console.log(`  Services mapped: ${Object.keys(serviceIdMap).length}/${backupData.data.services?.length || 0}`);
        console.log(`  Responsible Parties mapped: ${Object.keys(responsiblePartyIdMap).length}/${backupData.data.responsibleParties?.length || 0}`);

        // Import service responsible parties
        // For 'replace' mode: import ALL service responsible parties
        // For 'add' mode: import only those flagged for import (not duplicates)
        const serviceResponsiblePartyImportIndices = new Set(importFlags.serviceResponsibleParties || []);
        
        if (backupData.data.serviceResponsibleParties && backupData.data.serviceResponsibleParties.length > 0) {
          for (let i = 0; i < backupData.data.serviceResponsibleParties.length; i++) {
            const serviceResponsibleParty = backupData.data.serviceResponsibleParties[i];
            // Import if: replace mode (import all) OR add mode with flag
            const shouldImport = importType === 'replace' || serviceResponsiblePartyImportIndices.has(i);
            
            if (shouldImport) {
              const newServiceId = serviceIdMap[serviceResponsibleParty.service_id];
              const newResponsiblePartyId = responsiblePartyIdMap[serviceResponsibleParty.responsible_party_id];
              
              if (newServiceId && newResponsiblePartyId) {
                // Check if this association already exists
                const existing = await query(
                  'SELECT id FROM service_responsible_parties WHERE service_id = $1 AND responsible_party_id = $2',
                  [newServiceId, newResponsiblePartyId]
                );
                
                if (existing.rows.length === 0) {
                  await query(
                    `INSERT INTO service_responsible_parties (service_id, responsible_party_id, created_at, updated_at) 
                     VALUES ($1, $2, $3, $4)`,
                    [newServiceId, newResponsiblePartyId, serviceResponsibleParty.created_at, serviceResponsibleParty.updated_at]
                  );
                  console.log(`  ✅ Imported service-responsible party association: Service ${newServiceId} ↔ Responsible Party ${newResponsiblePartyId}`);
                } else {
                  console.log(`  ⏭️  Skipped existing association: Service ${newServiceId} ↔ Responsible Party ${newResponsiblePartyId}`);
                }
              } else {
                console.log(`  ⚠️  Skipped service responsible party (service or responsible party not found): Service ID ${serviceResponsibleParty.service_id} → ${newServiceId}, Responsible Party ID ${serviceResponsibleParty.responsible_party_id} → ${newResponsiblePartyId}`);
              }
            }
          }
        }

        // Import booking names
        // For 'replace' mode: import ALL booking names
        // For 'add' mode: bookingNames array is already pre-filtered by frontend, import all items in the array
        // (Unlike clients/services, bookingNames don't need ID mapping for other tables)
        
        if (backupData.data.bookingNames && backupData.data.bookingNames.length > 0) {
          console.log(`  📝 Processing ${backupData.data.bookingNames.length} booking names for import...`);
          
          for (let i = 0; i < backupData.data.bookingNames.length; i++) {
            const bookingName = backupData.data.bookingNames[i];
            
            // Check if booking name already exists
            const existing = await query(
              'SELECT id FROM booking_names WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
              [userId, bookingName.name]
            );
            
            if (existing.rows.length === 0) {
              await query(
                `INSERT INTO booking_names (name, user_id, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4)`,
                [bookingName.name, userId, bookingName.created_at, bookingName.updated_at || bookingName.created_at]
              );
              console.log(`  ✅ Imported booking name: ${bookingName.name}`);
            } else {
              console.log(`  ⏭️  Skipped existing booking name: ${bookingName.name}`);
            }
          }
        }

        // Import expense categories (preserve default/system categories)
        // For 'replace' mode: import ALL categories
        // For 'add' mode: import only those flagged for import (not duplicates)
        const expenseCategoryImportIndices = new Set(importFlags.expenseCategories || []);
        
        if (backupData.data.expenseCategories && backupData.data.expenseCategories.length > 0) {
          for (let i = 0; i < backupData.data.expenseCategories.length; i++) {
            const category = backupData.data.expenseCategories[i];
            
            // Import if: replace mode (import all) OR add mode with flag
            const shouldImport = importType === 'replace' || expenseCategoryImportIndices.has(i);
            
            if (!shouldImport) {
              console.log(`  ⏭️  Skipped category (not selected): ${category.name}`);
              continue;
            }
            
            // Skip if it's a default category that already exists
            if (category.is_default || category.user_id === null) {
              const existing = await query(
                'SELECT id FROM expense_categories WHERE name = $1 AND user_id IS NULL',
                [category.name]
              );
              if (existing.rows.length > 0) {
                console.log(`  ⏭️  Skipped default category: ${category.name} (already exists)`);
                continue;
              }
            }
            
            // Import category (preserve user_id: null for defaults, userId for custom)
            const categoryUserId = (category.is_default || category.user_id === null) ? null : userId;
            await query(
              `INSERT INTO expense_categories (user_id, name, is_default, created_at) 
               VALUES ($1, $2, $3, $4)`,
              [categoryUserId, category.name, category.is_default || false, category.created_at]
            );
            console.log(`  ✅ Imported category: ${category.name} ${categoryUserId ? '(custom)' : '(default)'}`);
          }
        }

        // Import bookings (need to map old IDs to new IDs)
        const clientIdMap = {};
        const bookingIdMap = {};

        if (backupData.data.bookings && backupData.data.bookings.length > 0) {
          // Get ID mappings for clients
          // For 'add' mode: map ALL clients (both newly imported and existing)
          // For 'replace' mode: map only newly imported ones
          const newClients = await query('SELECT id, name, phone, email FROM clients WHERE user_id = $1', [userId]);

          // Create mapping from old booking data to new database IDs
          if (backupData.data.clients && backupData.data.clients.length > 0) {
            for (const oldClient of backupData.data.clients) {
              // Find matching client by name, phone, or email
              const matchingClient = newClients.rows.find(c => 
                (c.name && oldClient.name && c.name.trim().toLowerCase() === oldClient.name.trim().toLowerCase()) ||
                (c.phone && oldClient.phone && c.phone.replace(/\D/g, '') === oldClient.phone.replace(/\D/g, '')) ||
                (c.email && oldClient.email && c.email.trim().toLowerCase() === oldClient.email.trim().toLowerCase())
              );
              if (matchingClient) {
                clientIdMap[oldClient.id] = matchingClient.id;
              }
            }
          }

          console.log('📊 ID Mapping Summary:');
          console.log(`  Clients mapped: ${Object.keys(clientIdMap).length}/${backupData.data.clients?.length || 0}`);
          console.log(`  Services mapped: ${Object.keys(serviceIdMap).length}/${backupData.data.services?.length || 0}`);
          console.log(`  Responsible Parties mapped: ${Object.keys(responsiblePartyIdMap).length}/${backupData.data.responsibleParties?.length || 0}`);
          console.log(`  Bookings to import: ${backupData.data.bookings.length}`);
          console.log('  Client ID Map:', clientIdMap);
          console.log('  Service ID Map:', serviceIdMap);

          for (const booking of backupData.data.bookings) {
            const newClientId = clientIdMap[booking.client_id];
            const newServiceId = serviceIdMap[booking.service_id];

            if (newClientId && newServiceId) {
              // Update service IDs in notes JSON if it contains services array
              let updatedNotes = booking.notes;
              if (booking.notes) {
                try {
                  const notesObj = JSON.parse(booking.notes);
                  if (notesObj.services && Array.isArray(notesObj.services)) {
                    // Map old service IDs to new IDs in the services array
                    notesObj.services = notesObj.services.map(service => {
                      const oldServiceId = parseInt(service.service_id);
                      const mappedServiceId = serviceIdMap[oldServiceId];
                      const oldResponsiblePartyId = parseInt(service.responsible_party_id);
                      const mappedResponsiblePartyId = responsiblePartyIdMap[oldResponsiblePartyId];
                      
                      const updatedService = { ...service };
                      if (mappedServiceId) {
                        updatedService.service_id = mappedServiceId.toString();
                      }
                      if (mappedResponsiblePartyId) {
                        updatedService.responsible_party_id = mappedResponsiblePartyId.toString();
                      }
                      
                      return updatedService;
                    });
                    updatedNotes = JSON.stringify(notesObj);
                    console.log(`  🔄 Mapped ${notesObj.services.length} service IDs and responsible party IDs in booking notes`);
                  }
                } catch (e) {
                  // If notes is not JSON, keep original
                  console.log(`  ℹ️  Notes is not JSON format, keeping as is`);
                }
              }

              const result = await query(
                `INSERT INTO bookings (user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, total_price, status, notes, booking_name, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
                [userId, newClientId, newServiceId, booking.booking_date, booking.booking_time || '00:00:00', booking.location_name || null, booking.location_map_url || null, booking.total_price, booking.status, updatedNotes, booking.booking_name || null, booking.created_at, booking.updated_at]
              );
              bookingIdMap[booking.id] = result.rows[0].id;
              console.log(`  ✅ Imported booking: ${booking.booking_date} - Client: ${newClientId}, Service: ${newServiceId}${booking.location_name ? ` at ${booking.location_name}` : ''}`);
            } else {
              console.log(`  ⚠️  Skipped booking (client or service not found): Client ID ${booking.client_id} → ${newClientId}, Service ID ${booking.service_id} → ${newServiceId}`);
            }
          }
          console.log(`  ✅ Successfully imported ${Object.keys(bookingIdMap).length} bookings`);
        }

        // Import payments
        if (backupData.data.payments && backupData.data.payments.length > 0) {
          for (const payment of backupData.data.payments) {
            const newBookingId = bookingIdMap[payment.booking_id];
            if (newBookingId) {
              await query(
                `INSERT INTO payments (booking_id, amount, payment_date, payment_method, payment_status, notes, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [newBookingId, payment.amount, payment.payment_date, payment.payment_method, payment.payment_status || 'paid', payment.notes, payment.created_at, payment.updated_at]
              );
            }
          }
        }

        // Import expenses (need to map category IDs, including defaults)
        // For 'replace' mode: import ALL expenses
        // For 'add' mode: import only those flagged for import (not duplicates)
        const expenseImportIndices = new Set(importFlags.expenses || []);
        
        if (backupData.data.expenses && backupData.data.expenses.length > 0) {
          // Build categoryIdMap by name, so even if category is duplicate and not imported, we can map to existing category
          const categoryIdMap = {};
          // Get all categories for this user (including default)
          const newCategories = await query(
            'SELECT id, name FROM expense_categories WHERE user_id = $1 OR user_id IS NULL', 
            [userId]
          );
          // Map by name (case-insensitive)
          newCategories.rows.forEach(category => {
            categoryIdMap[category.name.trim().toLowerCase()] = category.id;
          });

          let importedCount = 0;
          for (let i = 0; i < backupData.data.expenses.length; i++) {
            const expense = backupData.data.expenses[i];
            // Import if: replace mode (import all) OR add mode with flag
            const shouldImport = importType === 'replace' || expenseImportIndices.has(i);
            if (!shouldImport) {
              console.log(`  ⏭️  Skipped expense (not selected): ${expense.description}`);
              continue;
            }
            // Find category name from backupData expenseCategories (if available), else from expense itself
            let categoryName = null;
            if (expense.category_id && backupData.data.expenseCategories) {
              const catObj = backupData.data.expenseCategories.find(c => c.id === expense.category_id);
              if (catObj) categoryName = catObj.name;
            }
            // Fallback: if expense has categoryName property
            if (!categoryName && expense.categoryName) categoryName = expense.categoryName;
            // Fallback: if expense has category_name property
            if (!categoryName && expense.category_name) categoryName = expense.category_name;
            // Fallback: if expense has category (rare)
            if (!categoryName && expense.category) categoryName = expense.category;
            // Fallback: if expense has categoryName in notes
            if (!categoryName && expense.notes && typeof expense.notes === 'string' && expense.notes.includes('categoryName')) {
              try {
                const notesObj = JSON.parse(expense.notes);
                if (notesObj.categoryName) categoryName = notesObj.categoryName;
              } catch {}
            }
            // Final fallback: if expense has category_id as string (rare)
            if (!categoryName && typeof expense.category_id === 'string') categoryName = expense.category_id;
            // Normalize name
            if (categoryName) categoryName = categoryName.trim().toLowerCase();
            const newCategoryId = categoryName ? categoryIdMap[categoryName] : null;
            if (newCategoryId) {
              await query(
                `INSERT INTO expenses (user_id, category_id, amount, expense_date, description, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, newCategoryId, expense.amount, expense.expense_date, expense.description, expense.created_at, expense.updated_at]
              );
              importedCount++;
              console.log(`  ✅ Imported expense: ${expense.description} - Rp ${expense.amount}`);
            } else {
              console.log(`  ⚠️  Skipped expense (category not found): ${expense.description} (categoryName: ${categoryName})`);
            }
          }
          console.log(`  ✅ Total imported ${importedCount} expenses (out of ${backupData.data.expenses.length})`);
        }

        // Import company settings (including bank information)
        if (backupData.data.companySettings) {
          const settings = backupData.data.companySettings;
          await query(
            `INSERT INTO company_settings (
              user_id, company_name, company_address, company_phone, company_email, company_logo_url,
              bank_name, account_number, account_holder_name, payment_instructions,
              bank_name_alt, account_number_alt, account_holder_name_alt,
              created_at, updated_at
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
             ON CONFLICT (user_id) DO UPDATE SET 
             company_name = EXCLUDED.company_name,
             company_address = EXCLUDED.company_address,
             company_phone = EXCLUDED.company_phone,
             company_email = EXCLUDED.company_email,
             company_logo_url = EXCLUDED.company_logo_url,
             bank_name = EXCLUDED.bank_name,
             account_number = EXCLUDED.account_number,
             account_holder_name = EXCLUDED.account_holder_name,
             payment_instructions = EXCLUDED.payment_instructions,
             bank_name_alt = EXCLUDED.bank_name_alt,
             account_number_alt = EXCLUDED.account_number_alt,
             account_holder_name_alt = EXCLUDED.account_holder_name_alt,
             updated_at = EXCLUDED.updated_at`,
            [
              userId, 
              settings.company_name, 
              settings.company_address, 
              settings.company_phone, 
              settings.company_email, 
              settings.company_logo_url,
              settings.bank_name || null,
              settings.account_number || null,
              settings.account_holder_name || null,
              settings.payment_instructions || null,
              settings.bank_name_alt || null,
              settings.account_number_alt || null,
              settings.account_holder_name_alt || null,
              settings.created_at, 
              settings.updated_at
            ]
          );
          console.log(`  ✅ Imported company settings (with bank info)`);
        }

        // Reset all sequences to prevent duplicate key errors
        // This ensures SERIAL columns generate IDs higher than existing data
        console.log('📊 Resetting sequences...');
        const sequenceResets = [
          "SELECT setval('clients_id_seq', COALESCE((SELECT MAX(id) FROM clients), 0) + 1, false)",
          "SELECT setval('services_id_seq', COALESCE((SELECT MAX(id) FROM services), 0) + 1, false)",
          "SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 0) + 1, false)",
          "SELECT setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM payments), 0) + 1, false)",
          "SELECT setval('expenses_id_seq', COALESCE((SELECT MAX(id) FROM expenses), 0) + 1, false)",
          "SELECT setval('expense_categories_id_seq', COALESCE((SELECT MAX(id) FROM expense_categories), 0) + 1, false)",
          "SELECT setval('responsible_parties_id_seq', COALESCE((SELECT MAX(id) FROM responsible_parties), 0) + 1, false)",
          "SELECT setval('service_responsible_parties_id_seq', COALESCE((SELECT MAX(id) FROM service_responsible_parties), 0) + 1, false)",
          "SELECT setval('booking_names_id_seq', COALESCE((SELECT MAX(id) FROM booking_names), 0) + 1, false)"
        ];
        
        for (const resetQuery of sequenceResets) {
          try {
            await query(resetQuery);
          } catch (seqError) {
            // Ignore sequence errors (some tables might not have sequences)
            console.log(`  ⚠️ Sequence reset skipped: ${seqError.message}`);
          }
        }
        console.log('  ✅ Sequences reset successfully');

        // Commit transaction
        await query('COMMIT');

    res.json({
      success: true,
      message: importType === 'replace' 
        ? 'Data berhasil diganti dengan data dari backup!' 
        : 'Data dari backup berhasil ditambahkan!'
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error importing backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import backup data'
    });
  }
});

// ====================================
// GOOGLE CALENDAR ENDPOINTS
// ====================================

const googleCalendarService = require('./services/googleCalendarService');

// Get Google Calendar auth URL
app.get('/api/user/google-calendar/auth-url', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is Google OAuth user
    const userResult = await query(
      'SELECT auth_provider, google_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (user.auth_provider !== 'google' || !user.google_id) {
      return res.status(403).json({
        success: false,
        message: 'Fitur Google Calendar hanya tersedia untuk user yang login menggunakan akun Google'
      });
    }

    const authUrl = googleCalendarService.getAuthUrl(userId);

    res.json({
      success: true,
      message: 'Google Calendar auth URL generated successfully',
      data: {
        authUrl: authUrl
      }
    });

  } catch (error) {
    console.error('Error generating Google Calendar auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Google Calendar auth URL'
    });
  }
});

// Handle Google Calendar OAuth callback
app.get('/api/user/google-calendar/callback', async (req, res) => {
  try {
    const { code, state: userId, error } = req.query;

    console.log('Google Calendar callback received:', { code: !!code, userId, error });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error in callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/dashboard?calendar_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      console.error('No authorization code received');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/dashboard?calendar_error=no_code`);
    }

    if (!userId) {
      console.error('No state parameter (userId) received');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/dashboard?calendar_error=no_state`);
    }

    // Verify user exists
    const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      console.error('User not found for callback:', userId);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/dashboard?calendar_error=user_not_found`);
    }

    // Get tokens from Google
    console.log('Getting tokens from Google...');
    const tokens = await googleCalendarService.getTokens(code);
    console.log('Tokens received successfully');

    // Store tokens in database
    await query(
      `UPDATE users 
       SET google_access_token = $1, 
           google_refresh_token = $2, 
           google_token_expiry = $3,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        userId
      ]
    );

    console.log('Tokens stored successfully for user:', userId);

    // Redirect back to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?calendar_connected=true`);

  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?calendar_error=${encodeURIComponent(error.message)}`);
  }
});

// Check Google Calendar connection status
app.get('/api/user/google-calendar/status', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is Google OAuth user
    const userResult = await query(
      'SELECT auth_provider, google_id, google_access_token, google_refresh_token, google_token_expiry FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Must be Google user
    if (user.auth_provider !== 'google' || !user.google_id) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'Google Calendar only available for Google login users'
        }
      });
    }

    // Check if tokens exist
    if (!user.google_access_token || !user.google_refresh_token) {
      return res.json({
        success: true,
        data: {
          connected: false,
          needsReconnect: false,
          message: 'Not connected to Google Calendar'
        }
      });
    }

    // Validate connection with Google API
    const validationResult = await googleCalendarService.validateConnection(userId);

    if (!validationResult.success) {
      return res.json({
        success: true,
        data: {
          connected: false,
          needsReconnect: validationResult.needsReconnect || false,
          message: validationResult.message || 'Connection validation failed'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        connected: true,
        userEmail: validationResult.userEmail,
        tokenExpiry: user.google_token_expiry
      }
    });

  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Google Calendar status'
    });
  }
});

// Disconnect Google Calendar
app.post('/api/user/google-calendar/disconnect', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear Google Calendar tokens
    await query(
      `UPDATE users 
       SET google_access_token = NULL,
           google_refresh_token = NULL,
           google_token_expiry = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });

  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Calendar'
    });
  }
});

// Get Google Calendar events
app.get('/api/user/google-calendar/events', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeMin, timeMax, maxResults } = req.query;

    // Check if user is Google OAuth user
    const userResult = await query(
      'SELECT auth_provider, google_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (user.auth_provider !== 'google' || !user.google_id) {
      return res.status(403).json({
        success: false,
        message: 'Fitur Google Calendar hanya tersedia untuk user yang login menggunakan akun Google'
      });
    }

    const options = {};
    if (timeMin) options.timeMin = timeMin;
    if (timeMax) options.timeMax = timeMax;
    if (maxResults) options.maxResults = parseInt(maxResults);

    const result = await googleCalendarService.getCalendarEvents(userId, options);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Google Calendar events retrieved successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Google Calendar events'
    });
  }
});

// Create Google Calendar event
app.post('/api/user/google-calendar/events', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { summary, description, startDateTime, endDateTime, location, timeZone } = req.body;

    // Validate required fields
    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Summary, start date/time, and end date/time are required'
      });
    }

    const eventData = {
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
      timeZone
    };

    const result = await googleCalendarService.createCalendarEvent(userId, eventData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Google Calendar event created successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Google Calendar event'
    });
  }
});

// Update Google Calendar event
app.put('/api/user/google-calendar/events/:eventId', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;
    const { summary, description, startDateTime, endDateTime, location, timeZone } = req.body;

    // Validate required fields
    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Summary, start date/time, and end date/time are required'
      });
    }

    const eventData = {
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
      timeZone
    };

    const result = await googleCalendarService.updateCalendarEvent(userId, eventId, eventData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Google Calendar event updated successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Google Calendar event'
    });
  }
});

// Delete Google Calendar event
app.delete('/api/user/google-calendar/events/:eventId', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const result = await googleCalendarService.deleteCalendarEvent(userId, eventId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Google Calendar event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Google Calendar event'
    });
  }
});

// ====================================
// CLIENT SUBMISSIONS ENDPOINTS
// ====================================

// PUBLIC: Get booking info by booking code (NEW - Secure Method)
app.get('/api/public/booking/:bookingCode/info', async (req, res) => {
  try {
    const { bookingCode } = req.params;

    // Get user/company info by booking_code
    const userQuery = `
      SELECT 
        u.id, u.full_name, u.email, u.booking_code,
        cs.company_name, cs.company_logo_url, cs.company_address, 
        cs.company_phone, cs.company_email
      FROM users u
      LEFT JOIN company_settings cs ON u.id = cs.user_id
      WHERE u.booking_code = $1
    `;
    const userResult = await query(userQuery, [bookingCode]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link booking tidak valid'
      });
    }

    const userId = userResult.rows[0].id;

    // Get available services
    const servicesQuery = `
      SELECT id, name, price as default_price, description
      FROM services
      WHERE user_id = $1 AND is_active = true
      ORDER BY name
    `;
    const servicesResult = await query(servicesQuery, [userId]);

    // Get booking names for autocomplete
    const bookingNamesQuery = `
      SELECT DISTINCT booking_name
      FROM bookings
      WHERE user_id = $1 AND booking_name IS NOT NULL AND booking_name != ''
      ORDER BY booking_name
      LIMIT 50
    `;
    const bookingNamesResult = await query(bookingNamesQuery, [userId]);

    res.json({
      success: true,
      data: {
        user: {
          id: userResult.rows[0].id,
          name: userResult.rows[0].full_name,
          companyName: userResult.rows[0].company_name || userResult.rows[0].full_name,
          logo: userResult.rows[0].company_logo_url,
          address: userResult.rows[0].company_address,
          phone: userResult.rows[0].company_phone,
          email: userResult.rows[0].company_email || userResult.rows[0].email
        },
        services: servicesResult.rows.map(s => ({
          id: s.id,
          name: s.name,
          default_price: parseFloat(s.default_price),
          description: s.description
        })),
        bookingNames: bookingNamesResult.rows.map(r => r.booking_name)
      }
    });
  } catch (error) {
    console.error('Error fetching booking info by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking info'
    });
  }
});

// PUBLIC: Submit client booking by booking code (NEW - Secure Method)
app.post('/api/public/booking/:bookingCode/submit', async (req, res) => {
  try {
    const { bookingCode } = req.params;
    
    // Get user by booking code
    const userQuery = 'SELECT id FROM users WHERE booking_code = $1';
    const userResult = await query(userQuery, [bookingCode]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link booking tidak valid'
      });
    }
    
    const userId = userResult.rows[0].id;
    
    // Extract request data
    const {
      client_name,
      client_phone,
      client_country_code = '62',
      client_address,
      booking_name,
      booking_date,
      booking_date_end,
      booking_time,
      booking_time_end,
      location_name,
      location_map_url,
      notes,
      selected_services = []
    } = req.body;

    // Validate required fields
    if (!client_name || !client_phone || !booking_date || selected_services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nama, telepon, tanggal booking, dan minimal 1 layanan harus diisi'
      });
    }

    // Format phone with country code
    const fullPhone = `+${client_country_code}${client_phone}`;
    
    // Prepare services data
    const servicesData = selected_services.map(s => ({
      service_id: s.service_id || s.id,
      service_name: s.service_name || s.name,
      default_price: s.default_price || 0,
      quantity: s.quantity || 1,
      description: s.description || ''
    }));

    // Insert client submission
    const insertQuery = `
      INSERT INTO client_submissions (
        user_id, client_name, contact, address, booking_name,
        booking_date, booking_date_end, start_time, end_time,
        location, location_map_url, services, notes, status,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', NOW(), NOW())
      RETURNING id
    `;
    
    const result = await query(insertQuery, [
      userId,
      client_name,
      fullPhone,
      client_address || null,
      booking_name || null,
      booking_date,
      booking_date_end || booking_date,
      booking_time || null,
      booking_time_end || null,
      location_name || null,
      location_map_url || null,
      JSON.stringify(servicesData),
      notes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dikirim! Kami akan segera menghubungi Anda.',
      data: {
        submission_id: result.rows[0].id
      }
    });
  } catch (error) {
    console.error('Error submitting booking by code:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim booking. Silakan coba lagi.'
    });
  }
});

// OLD ENDPOINTS - Keep for backward compatibility (DEPRECATED)
// PUBLIC: Get user info and services for client booking form
app.get('/api/public/user/:userId/booking-info', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user/company info
    const userQuery = `
      SELECT 
        u.id, u.full_name, u.email,
        cs.company_name, cs.company_logo_url, cs.company_address, cs.company_phone, cs.company_email
      FROM users u
      LEFT JOIN company_settings cs ON u.id = cs.user_id
      WHERE u.id = $1
    `;
    const userResult = await query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get available services
    const servicesQuery = `
      SELECT id, name, price as default_price, description
      FROM services
      WHERE user_id = $1 AND is_active = true
      ORDER BY name
    `;
    const servicesResult = await query(servicesQuery, [userId]);

    res.json({
      success: true,
      data: {
        user: {
          id: userResult.rows[0].id,
          name: userResult.rows[0].full_name,
          companyName: userResult.rows[0].company_name || userResult.rows[0].full_name,
          logo: userResult.rows[0].company_logo_url,
          address: userResult.rows[0].company_address,
          phone: userResult.rows[0].company_phone,
          email: userResult.rows[0].company_email || userResult.rows[0].email
        },
        services: servicesResult.rows.map(s => ({
          id: s.id,
          name: s.name,
          default_price: parseFloat(s.default_price),
          description: s.description
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching booking info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking info'
    });
  }
});

// PUBLIC: Get booking names for a user (for autocomplete)
app.get('/api/public/user/:userId/booking-names', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get distinct booking names from bookings table
    const bookingNamesQuery = `
      SELECT DISTINCT booking_name
      FROM bookings
      WHERE user_id = $1 AND booking_name IS NOT NULL AND booking_name != ''
      ORDER BY booking_name
      LIMIT 50
    `;
    const result = await query(bookingNamesQuery, [userId]);

    res.json({
      success: true,
      data: result.rows.map(row => row.booking_name)
    });
  } catch (error) {
    console.error('Error fetching booking names:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking names'
    });
  }
});

// PUBLIC: Submit booking from client (no authentication required)
app.post('/api/public/client-submission', async (req, res) => {
  try {
    const {
      user_id,
      client_name,
      client_phone,
      client_country_code = '62',
      client_address,
      booking_name,
      booking_date,
      booking_date_end,
      booking_time,
      booking_time_end,
      location_name,
      location_map_url,
      services,
      notes
    } = req.body;

    // Validation
    if (!user_id || !client_name || !client_phone || !booking_date) {
      return res.status(400).json({
        success: false,
        message: 'User ID, client name, phone, and booking date are required'
      });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    // Insert submission
    const insertQuery = `
      INSERT INTO client_submissions (
        user_id, client_name, client_phone, client_country_code, client_address,
        booking_name, booking_date, booking_date_end, booking_time, booking_time_end,
        location_name, location_map_url, services, notes, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', NOW(), NOW())
      RETURNING id, client_name, client_phone, booking_date, status, created_at
    `;

    const result = await query(insertQuery, [
      user_id,
      client_name,
      client_phone,
      client_country_code,
      client_address || null,
      booking_name || null,
      booking_date,
      booking_date_end || null,
      booking_time || null,
      booking_time_end || null,
      location_name || null,
      location_map_url || null,
      JSON.stringify(services),
      notes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking submission sent successfully',
      data: {
        id: result.rows[0].id,
        client_name: result.rows[0].client_name,
        client_phone: result.rows[0].client_phone,
        booking_date: result.rows[0].booking_date,
        status: result.rows[0].status
      }
    });
  } catch (error) {
    console.error('Error creating client submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit booking'
    });
  }
});

// PROTECTED: Get all client submissions for a user
app.get('/api/user/client-submissions', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereConditions = ['cs.user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`cs.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const submissionsQuery = `
      SELECT 
        cs.id,
        cs.booking_name,
        cs.client_name,
        cs.client_phone as contact,
        cs.client_address as address,
        to_char(cs.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(cs.booking_date_end, 'YYYY-MM-DD') as booking_date_end,
        to_char(cs.booking_time, 'HH24:MI') as start_time,
        to_char(cs.booking_time_end, 'HH24:MI') as end_time,
        cs.location_name as location,
        cs.location_map_url,
        cs.services,
        cs.notes,
        cs.status,
        cs.created_at,
        cs.updated_at
      FROM client_submissions cs
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN cs.status = 'pending' THEN 0 ELSE 1 END,
        cs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(pageSize), offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM client_submissions cs
      WHERE ${whereClause}
    `;

    const [submissions, countResult] = await Promise.all([
      query(submissionsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        submissions: submissions.rows.map(s => ({
          ...s,
          services: typeof s.services === 'string' ? JSON.parse(s.services) : s.services
        })),
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching client submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client submissions'
    });
  }
});

// PROTECTED: Get pending submissions count
app.get('/api/user/client-submissions/pending-count', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const countQuery = `
      SELECT COUNT(*) as count
      FROM client_submissions
      WHERE user_id = $1 AND status = 'pending'
    `;
    
    const result = await query(countQuery, [userId]);
    
    res.json({
      success: true,
      data: {
        count: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending count'
    });
  }
});

// PROTECTED: Get single submission detail
app.get('/api/user/client-submissions/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = req.params.id;

    const submissionQuery = `
      SELECT 
        cs.id,
        cs.user_id,
        cs.booking_name,
        cs.client_name,
        cs.client_phone as contact,
        cs.client_country_code,
        cs.client_address as address,
        to_char(cs.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(cs.booking_date_end, 'YYYY-MM-DD') as booking_date_end,
        to_char(cs.booking_time, 'HH24:MI') as start_time,
        to_char(cs.booking_time_end, 'HH24:MI') as end_time,
        cs.location_name as location,
        cs.location_map_url,
        cs.services,
        cs.notes,
        cs.status,
        cs.created_at,
        cs.updated_at
      FROM client_submissions cs
      WHERE cs.id = $1 AND cs.user_id = $2
    `;

    const result = await query(submissionQuery, [submissionId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submission = result.rows[0];
    submission.services = typeof submission.services === 'string' 
      ? JSON.parse(submission.services) 
      : submission.services;

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission'
    });
  }
});

// PROTECTED: Confirm submission and create booking
app.post('/api/user/client-submissions/:id/confirm', authenticate, enforceTenancy, async (req, res) => {
  const dbClient = await require('./config/database').getClient();
  
  try {
    await dbClient.query('BEGIN');
    
    const userId = req.user.id;
    const submissionId = req.params.id;
    
    // Get ALL fields from request body
    const {
      booking_name,
      client_name,
      client_phone,
      client_address,
      booking_date,
      booking_date_end,
      booking_time,
      booking_time_end,
      booking_days,
      location_name,
      location_map_url,
      services = [],
      responsible_parties = [],
      status = 'Dijadwalkan',
      payment_status = 'Belum Bayar',
      amount_paid = 0,
      discount_value = 0,
      discount_type = 'rupiah',
      tax_percentage = 0,
      additional_fees = [],
      total_amount,
      notes,
      sync_to_google_calendar = false
    } = req.body;

    console.log('=== CONFIRM BOOKING REQUEST ===');
    console.log('Submission ID:', submissionId);
    console.log('User ID:', userId);
    console.log('Booking name:', booking_name);
    console.log('Services received:', services);
    console.log('Total amount:', total_amount);

    // Map payment status to English
    const paymentStatusMap = {
      'Belum Bayar': 'unpaid',
      'Sudah Bayar': 'paid',
      'Bayar Sebagian': 'partial'
    };
    const mappedPaymentStatus = paymentStatusMap[payment_status] || 'unpaid';

    // Verify submission exists and is pending
    const submissionQuery = `
      SELECT id, status FROM client_submissions
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
    `;
    const submissionResult = await dbClient.query(submissionQuery, [submissionId, userId]);

    if (submissionResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Pending submission not found'
      });
    }

    console.log('Submission verified, proceeding with booking creation...');

    // Validate required fields from request
    if (!client_name || !client_phone || !booking_date) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Client name, phone, and booking date are required'
      });
    }

    if (!services || services.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    // Find or create client using data from REQUEST (not old submission)
    let clientId;
    const existingClient = await dbClient.query(
      'SELECT id FROM clients WHERE user_id = $1 AND phone = $2',
      [userId, client_phone]
    );

    if (existingClient.rows.length > 0) {
      clientId = existingClient.rows[0].id;
      // Update client info from REQUEST
      await dbClient.query(
        'UPDATE clients SET name = $1, address = $2, updated_at = NOW() WHERE id = $3',
        [client_name, client_address, clientId]
      );
    } else {
      // Create new client from REQUEST
      const newClient = await dbClient.query(
        `INSERT INTO clients (user_id, name, phone, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        [userId, client_name, client_phone, client_address]
      );
      clientId = newClient.rows[0].id;
    }

    console.log('Client ID:', clientId);

    // Use total_amount from REQUEST if provided, otherwise calculate
    let finalTotalAmount = total_amount;
    if (!finalTotalAmount || finalTotalAmount === 0) {
      // Calculate totals from services
      let subtotal = 0;
      services.forEach(s => {
        const price = s.custom_price || s.default_price || 0;
        const qty = s.quantity || 1;
        subtotal += price * qty;
      });

      // Apply discount
      let discountAmount = 0;
      if (discount_value > 0) {
        if (discount_type === 'persen') {
          discountAmount = (subtotal * discount_value) / 100;
        } else {
          discountAmount = discount_value;
        }
      }
      const afterDiscount = subtotal - discountAmount;

      // Apply tax
      const taxAmount = afterDiscount * (tax_percentage / 100);

      // Add additional fees
      const feesTotal = additional_fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

      finalTotalAmount = afterDiscount + taxAmount + feesTotal;
    }

    console.log('Final total amount:', finalTotalAmount);

    // Get first service ID for main booking
    const mainServiceId = services[0]?.service_id || services[0]?.id;
    console.log('Main service ID:', mainServiceId, 'Services:', services);
    
    if (!mainServiceId) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No valid service found in services array'
      });
    }

    // Map status to database format
    const statusMap = {
      'Dijadwalkan': 'confirmed',
      'Selesai': 'completed',
      'Dibatalkan': 'cancelled'
    };
    const dbStatus = statusMap[status] || 'confirmed';

    // Fetch full responsible party data if IDs provided
    let responsiblePartiesData = [];
    if (responsible_parties && responsible_parties.length > 0) {
      const rpQuery = `
        SELECT id, name, phone, address 
        FROM responsible_parties 
        WHERE id = ANY($1) AND user_id = $2
      `;
      const rpResult = await dbClient.query(rpQuery, [responsible_parties, userId]);
      responsiblePartiesData = rpResult.rows;
      console.log('Responsible parties loaded:', responsiblePartiesData.length);
    }

    // Create comprehensive booking notes JSON with ALL data
    const bookingNotes = JSON.stringify({
      // Original submission data
      from_client_submission: true,
      submission_id: submissionId,
      
      // Booking details from REQUEST
      booking_date_end: booking_date_end,
      booking_time_end: booking_time_end,
      booking_days: booking_days || 1,
      
      // Services with complete details from REQUEST
      services: services.map(s => ({
        service_id: s.service_id,
        service_name: s.service_name,
        custom_price: s.custom_price,
        quantity: s.quantity,
        responsible_party_id: s.responsible_party_id,
        description: s.description
      })),
      
      // Financial details
      discount: {
        value: discount_value,
        type: discount_type
      },
      tax: {
        percentage: tax_percentage
      },
      additional_fees: additional_fees || [],
      
      // Responsible parties - FULL OBJECTS with name, phone, address
      responsible_parties: responsiblePartiesData,
      
      // Notes from REQUEST
      notes: notes,
      
      // Google Calendar sync flag
      sync_to_google_calendar: sync_to_google_calendar
    });

    console.log('Creating booking with notes:', bookingNotes);

    // Create booking with ALL fields from REQUEST
    let bookingId;
    try {
      const bookingQuery = `
        INSERT INTO bookings (
          user_id, client_id, service_id,
          booking_name, booking_date, booking_time,
          location_name, location_map_url,
          status, total_price, notes,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id
      `;
      const bookingResult = await dbClient.query(bookingQuery, [
        userId,
        clientId,
        mainServiceId,
        booking_name,  // From REQUEST, not submission
        booking_date,  // From REQUEST
        booking_time,  // From REQUEST
        location_name,  // From REQUEST
        location_map_url,  // From REQUEST
        dbStatus,
        finalTotalAmount,
        bookingNotes
      ]);
      bookingId = bookingResult.rows[0].id;
      console.log('Booking created with ID:', bookingId);
    } catch (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }

    // Create payment record
    const paymentQuery = `
      INSERT INTO payments (booking_id, payment_status, amount, payment_date, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW(), NOW())
    `;
    await dbClient.query(paymentQuery, [bookingId, mappedPaymentStatus, amount_paid]);

    // Update submission status
    await dbClient.query(
      `UPDATE client_submissions 
       SET status = 'confirmed', updated_at = NOW()
       WHERE id = $1`,
      [submissionId]
    );

    await dbClient.query('COMMIT');

    res.json({
      success: true,
      message: 'Submission confirmed and booking created',
      data: {
        booking_id: bookingId,
        client_id: clientId
      }
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error confirming submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm submission: ' + error.message
    });
  } finally {
    dbClient.release();
  }
});

// PROTECTED: Reject submission
app.post('/api/user/client-submissions/:id/reject', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = req.params.id;
    const { reason } = req.body;

    const updateQuery = `
      UPDATE client_submissions
      SET status = 'rejected', notes = COALESCE(notes, '') || E'\n\n[REJECTED]: ' || $3, updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
      RETURNING id
    `;

    const result = await query(updateQuery, [submissionId, userId, reason || 'No reason provided']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Submission rejected'
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject submission'
    });
  }
});

// PROTECTED: Delete submission
app.delete('/api/user/client-submissions/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const submissionId = req.params.id;

    const deleteQuery = `
      DELETE FROM client_submissions
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [submissionId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete submission'
    });
  }
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5001;
 app.listen(PORT, '0.0.0.0', () => {
   console.log(`\n🚀 Server is running on http://0.0.0.0:${PORT}`);
   console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
   console.log(`🌐 API available at http://YOUR_SERVER_IP:${PORT}/api`);
   console.log(`⏰ Started at: ${new Date().toLocaleString('id-ID')}\n`);
 });

module.exports = app;
