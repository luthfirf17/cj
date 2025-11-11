const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

// Import database connection
const { query } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');

// Import authentication middleware
const { authenticate, enforceTenancy } = require('./middlewares/authMiddleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Real endpoints with database
app.get('/api/user/dashboard/stats', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_booking,
        COUNT(*) FILTER (WHERE status = 'confirmed') as scheduled,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM bookings
      WHERE user_id = $1
    `;
    
    const paymentQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'unpaid') as unpaid,
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'partial') as down_payment,
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'paid') as paid
      FROM bookings b
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.user_id = $1
    `;
    
    const stats = await query(statsQuery, [userId]);
    const payments = await query(paymentQuery, [userId]);
    
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
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          bookingDetails = JSON.parse(booking.notes);
        }
      } catch (parseError) {
        console.log('Notes is not JSON format for booking', booking.id);
      }
      
      return {
        ...booking,
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
          client_name: booking.client_name,
          contact: booking.contact,
          services: [booking.service_name],
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          location_name: booking.location_name,
          location_map_url: booking.location_map_url,
          status: booking.status,
          payment_status: booking.payment_status,
          total_amount: parseFloat(booking.total_amount || booking.total_price),
          amount_paid: parseFloat(booking.amount_paid),
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

// PUT: Update booking
app.put('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  const client = await require('./config/database').getClient();
  
  try {
    await client.query('BEGIN');
    
    const bookingId = req.params.id;
    const userId = req.user.id;
    const {
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
        SET service_id = $1, 
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
        SET booking_date = $1, 
            booking_time = $2, 
            location_name = $3,
            location_map_url = $4,
            status = $5, 
            total_price = $6, 
            notes = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND user_id = $9
        RETURNING id
      `;
      updateParams = [
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
        to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(b.booking_time, 'HH24:MI') as booking_time,
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
    const {
      client_id,
      client_name,
      contact,
      address,
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status = 'pending',
      total_amount,
      amount_paid = 0,
      notes
    } = req.body;

    let finalClientId = client_id;

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
      INSERT INTO bookings (user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, status, total_price, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      'SELECT id, email as username, full_name as name, email, role, created_at FROM users WHERE id = $1',
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

    // Update profile
    const result = await query(
      `UPDATE users 
       SET full_name = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, email as username, full_name as name, email, role, created_at`,
      [name, email, user_id]
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

    // Verify current password for security
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini diperlukan untuk keamanan'
      });
    }

    // Get user's current password hash and security PIN
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini salah'
      });
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
    
    let dateFilter = '';
    const params = [userId];
    let paramCount = 1;
    
    if (month && year) {
      paramCount++;
      dateFilter = ` AND EXTRACT(MONTH FROM b.booking_date) = $${paramCount}`;
      params.push(month);
      paramCount++;
      dateFilter += ` AND EXTRACT(YEAR FROM b.booking_date) = $${paramCount}`;
      params.push(year);
    }
    
    // Get revenue data from bookings and payments
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
        
        -- Total Paid: amount yang sudah dibayar (termasuk dari cancelled jika ada pembayaran)
        COALESCE(SUM(CAST(COALESCE(p.amount_paid, 0) AS DECIMAL)), 0) as total_paid,
        
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
      WHERE (b.user_id = $1 OR $1 IS NULL) ${dateFilter}`,
      params
    );
    
    // Get expenses data
    let expenseParams = [userId];
    let expenseDateFilter = '';
    
    if (month && year) {
      expenseDateFilter = ' AND EXTRACT(MONTH FROM expense_date) = $2 AND EXTRACT(YEAR FROM expense_date) = $3';
      expenseParams = [userId, month, year];
    }
    
    const expenseResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE user_id = $1 ${expenseDateFilter}`,
      expenseParams
    );
    
    const revenue = revenueResult.rows[0];
    const expenses = expenseResult.rows[0];
    
    res.json({
      success: true,
      data: {
        total_revenue: parseFloat(revenue.total_revenue),
        total_paid: parseFloat(revenue.total_paid),
        total_unpaid: parseFloat(revenue.total_unpaid),
        total_expenses: parseFloat(expenses.total_expenses),
        net_income: parseFloat(revenue.total_paid) - parseFloat(expenses.total_expenses)
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
              b.total_price, b.notes, b.created_at,
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

// Export to Excel/CSV
app.get('/api/backup/export/:format', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { format } = req.params; // 'xlsx' or 'csv'

    // Import required libraries
    const ExcelJS = require('exceljs');

    // Get selection from query params (default all true)
    const selection = {
      companySettings: req.query.companySettings !== 'false',
      clients: req.query.clients !== 'false',
      services: req.query.services !== 'false',
      bookings: req.query.bookings !== 'false',
      payments: req.query.payments !== 'false',
      expenses: req.query.expenses !== 'false',
      expenseCategories: req.query.expenseCategories !== 'false'
    };

    // Get selected IDs from query params
    const selectedIds = {
      clients: req.query.clientsIds ? JSON.parse(req.query.clientsIds) : null,
      services: req.query.servicesIds ? JSON.parse(req.query.servicesIds) : null,
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
      
      // Apply borders to all cells
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          
          // Data rows alignment
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'top', wrapText: true };
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
      let bookingsQuery = `SELECT 
        b.id, b.booking_date, b.booking_time,
        c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address,
        s.name as service_name, s.description as service_desc, s.price as service_price, s.duration as service_duration,
        b.total_price, b.status, b.notes,
        b.created_at, b.updated_at
       FROM bookings b 
       LEFT JOIN clients c ON b.client_id = c.id 
       LEFT JOIN services s ON b.service_id = s.id 
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
          { header: 'Tanggal Booking', key: 'booking_date', width: 20 },
          { header: 'Waktu Booking', key: 'booking_time', width: 15 },
          { header: 'Nama Klien', key: 'client_name', width: 28 },
          { header: 'Telepon Klien', key: 'client_phone', width: 18 },
          { header: 'Email Klien', key: 'client_email', width: 28 },
          { header: 'Alamat Klien', key: 'client_address', width: 40 },
          { header: 'Nama Layanan', key: 'service_name', width: 28 },
          { header: 'Deskripsi Layanan', key: 'service_desc', width: 40 },
          { header: 'Harga Layanan', key: 'service_price', width: 18 },
          { header: 'Durasi Layanan (menit)', key: 'service_duration', width: 20 },
          { header: 'Total Harga', key: 'total_price', width: 18 },
          { header: 'Status Booking', key: 'status', width: 15 },
          { header: 'Catatan Booking', key: 'notes', width: 45 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        // Add rows
        bookings.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            booking_date: formatDate(row.booking_date),
            booking_time: row.booking_time || '',
            client_name: row.client_name || '',
            client_phone: row.client_phone || '',
            client_email: row.client_email || '',
            client_address: row.client_address || '',
            service_name: row.service_name || '',
            service_desc: row.service_desc || '',
            service_price: row.service_price ? formatCurrency(row.service_price) : '',
            service_duration: row.service_duration || '',
            total_price: row.total_price ? formatCurrency(row.total_price) : 'Rp 0',
            status: row.status || '',
            notes: parseNotes(row.notes),
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        // Apply styling
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${bookings.rows.length} bookings`);
      }
    }

    // Fetch and add Payments sheet if selected
    if (selection.payments) {
      let paymentsQuery = `SELECT 
        p.id, p.payment_date,
        c.name as client_name, c.phone as client_phone,
        b.id as booking_id, b.booking_date,
        s.name as service_name,
        b.total_price as booking_total,
        p.amount, p.payment_method, p.notes,
        p.created_at, p.updated_at
       FROM payments p 
       LEFT JOIN bookings b ON p.booking_id = b.id 
       LEFT JOIN clients c ON b.client_id = c.id 
       LEFT JOIN services s ON b.service_id = s.id 
       WHERE b.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.payments && selectedIds.payments.length > 0) {
        paymentsQuery += ' AND p.id = ANY($2::int[])';
        params.push(selectedIds.payments);
      }
      
      paymentsQuery += ' ORDER BY p.payment_date DESC';
      const payments = await query(paymentsQuery, params);
      
      if (payments.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Pembayaran');
        
        worksheet.columns = [
          { header: 'ID Pembayaran', key: 'id', width: 14 },
          { header: 'Tanggal Pembayaran', key: 'payment_date', width: 22 },
          { header: 'Nama Klien', key: 'client_name', width: 28 },
          { header: 'Telepon Klien', key: 'client_phone', width: 18 },
          { header: 'ID Booking', key: 'booking_id', width: 12 },
          { header: 'Tanggal Booking', key: 'booking_date', width: 20 },
          { header: 'Nama Layanan', key: 'service_name', width: 28 },
          { header: 'Total Booking', key: 'booking_total', width: 18 },
          { header: 'Jumlah Dibayar', key: 'amount', width: 18 },
          { header: 'Metode Pembayaran', key: 'payment_method', width: 22 },
          { header: 'Catatan', key: 'notes', width: 35 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        payments.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            payment_date: formatDate(row.payment_date),
            client_name: row.client_name || '',
            client_phone: row.client_phone || '',
            booking_id: row.booking_id,
            booking_date: formatDate(row.booking_date),
            service_name: row.service_name || '',
            booking_total: row.booking_total ? formatCurrency(row.booking_total) : 'Rp 0',
            amount: row.amount ? formatCurrency(row.amount) : 'Rp 0',
            payment_method: row.payment_method || '',
            notes: row.notes || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${payments.rows.length} payments`);
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
          { header: 'Icon Kategori', key: 'category_icon', width: 14 },
          { header: 'Warna Kategori', key: 'category_color', width: 18 },
          { header: 'Jumlah', key: 'amount', width: 18 },
          { header: 'Deskripsi', key: 'description', width: 40 },
          { header: 'Catatan', key: 'notes', width: 40 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        expenses.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            expense_date: formatDate(row.expense_date),
            category_name: row.category_name || '',
            category_icon: row.category_icon || '',
            category_color: row.category_color || '',
            amount: row.amount ? formatCurrency(row.amount) : 'Rp 0',
            description: row.description || '',
            notes: row.notes || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
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
          { header: 'Warna', key: 'color', width: 18 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        expenseCategories.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            icon: row.icon || '',
            color: row.color || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${expenseCategories.rows.length} expense categories`);
      }
    }

    // Fetch and add Clients sheet if selected
    if (selection.clients) {
      let clientsQuery = `SELECT 
        id, name, phone, email, address, notes,
        created_at, updated_at
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
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Alamat', key: 'address', width: 45 },
          { header: 'Catatan', key: 'notes', width: 40 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        clients.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            email: row.email || '',
            address: row.address || '',
            notes: row.notes || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${clients.rows.length} clients`);
      }
    }

    // Fetch and add Services sheet if selected
    if (selection.services) {
      let servicesQuery = `SELECT 
        id, name, description, price, duration,
        created_at, updated_at
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
          { header: 'Deskripsi', key: 'description', width: 45 },
          { header: 'Harga', key: 'price', width: 18 },
          { header: 'Durasi (menit)', key: 'duration', width: 18 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        services.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            description: row.description || '',
            price: row.price ? formatCurrency(row.price) : 'Rp 0',
            duration: row.duration || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${services.rows.length} services`);
      }
    }

    // Add company settings sheet (if selected and exists)
    if (selection.companySettings) {
      const companySettings = await query(
        `SELECT 
          company_name, company_address, company_phone, company_email,
          company_logo_url, bank_name, account_number, account_holder_name,
          created_at, updated_at
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
          { header: 'Logo URL', key: 'company_logo_url', width: 50 },
          { header: 'Nama Bank', key: 'bank_name', width: 26 },
          { header: 'Nomor Rekening', key: 'account_number', width: 24 },
          { header: 'Nama Pemegang Rekening', key: 'account_holder_name', width: 36 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        companySettings.rows.forEach(row => {
          worksheet.addRow({
            company_name: row.company_name || '',
            company_address: row.company_address || '',
            company_phone: row.company_phone || '',
            company_email: row.company_email || '',
            company_logo_url: row.company_logo_url || '',
            bank_name: row.bank_name || '',
            account_number: row.account_number || '',
            account_holder_name: row.account_holder_name || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
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
    console.error('Error exporting to Excel/CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data: ' + error.message
    });
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
      bookings: req.query.bookings !== 'false',
      payments: req.query.payments !== 'false',
      expenses: req.query.expenses !== 'false',
      expenseCategories: req.query.expenseCategories !== 'false'
    };

    // Get selected IDs from query params
    const selectedIds = {
      clients: req.query.clientsIds ? JSON.parse(req.query.clientsIds) : null,
      services: req.query.servicesIds ? JSON.parse(req.query.servicesIds) : null,
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
          
          // 7. Delete company_settings (references user)
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
        const serviceIdMap = {};
        const bookingIdMap = {};

        if (backupData.data.bookings && backupData.data.bookings.length > 0) {
          // Get ID mappings for clients and services
          // For 'add' mode: map ALL clients/services (both newly imported and existing)
          // For 'replace' mode: map only newly imported ones
          const newClients = await query('SELECT id, name, phone, email FROM clients WHERE user_id = $1', [userId]);
          const newServices = await query('SELECT id, name FROM services WHERE user_id = $1', [userId]);

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

          console.log('📊 ID Mapping Summary:');
          console.log(`  Clients mapped: ${Object.keys(clientIdMap).length}/${backupData.data.clients?.length || 0}`);
          console.log(`  Services mapped: ${Object.keys(serviceIdMap).length}/${backupData.data.services?.length || 0}`);
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
                      if (mappedServiceId) {
                        return {
                          ...service,
                          service_id: mappedServiceId.toString()
                        };
                      }
                      return service;
                    });
                    updatedNotes = JSON.stringify(notesObj);
                    console.log(`  🔄 Mapped ${notesObj.services.length} service IDs in booking notes`);
                  }
                } catch (e) {
                  // If notes is not JSON, keep original
                  console.log(`  ℹ️  Notes is not JSON format, keeping as is`);
                }
              }

              const result = await query(
                `INSERT INTO bookings (user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, total_price, status, notes, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
                [userId, newClientId, newServiceId, booking.booking_date, booking.booking_time || '00:00:00', booking.location_name || null, booking.location_map_url || null, booking.total_price, booking.status, updatedNotes, booking.created_at, booking.updated_at]
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
          const categoryIdMap = {};
          // Get both user categories and default categories
          const newCategories = await query(
            'SELECT id, name FROM expense_categories WHERE user_id = $1 OR user_id IS NULL', 
            [userId]
          );
          
          newCategories.rows.forEach(category => {
            const oldCategory = backupData.data.expenseCategories?.find(c => c.name === category.name);
            if (oldCategory) categoryIdMap[oldCategory.id] = category.id;
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
            
            const newCategoryId = categoryIdMap[expense.category_id];
            if (newCategoryId) {
              await query(
                `INSERT INTO expenses (user_id, category_id, amount, expense_date, description, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, newCategoryId, expense.amount, expense.expense_date, expense.description, expense.created_at, expense.updated_at]
              );
              importedCount++;
              console.log(`  ✅ Imported expense: ${expense.description} - Rp ${expense.amount}`);
            } else {
              console.log(`  ⚠️  Skipped expense (category not found): ${expense.description}`);
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
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log(`⏰ Started at: ${new Date().toLocaleString('id-ID')}\n`);
});

module.exports = app;
